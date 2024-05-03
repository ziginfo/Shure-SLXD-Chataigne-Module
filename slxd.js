var flashtime = 2.5; //time the flashing indicator stays lit
var device_flashtime = 0;
var channel_1_flashtime = 0;
var channel_2_flashtime = 0;
var todo = false;
var last_received = {};
var contain = {
	"name"	:	["Chan Name", "s", ""],
	"trans" : ["Transmitter", "s",""],
	"gain" : ["Audio Gain", "s",""],
	"audioswitch" : ["Audio Level Switch", "s", ""],
	"frequ" : ["Frequency", "s",""],
	"rfgroup" : ["RF Group", "s",""],
	"rfchann" : ["RF Channel", "s",""],
	"rflvl" : ["RF", "s", ""],
	"rfgpeak" : ["RF Level", "f2", ""],
	"audiolvl" : ["Audio Level RMS", "f2", ""],
	"audlvlpk" : ["Audio Level Peak", "f2", ""],
	"audiopeak" : ["Audio Peak", "s", ""],	
	"battrun" : ["Battery Runtime", "s", ""],
	"battcharge" : ["Battery Charge", "f3", ""]};

// =======================================
//			FUNCTION INIT
// =======================================


function init() {
  script.setUpdateRate(2);
  //request all value fields
  getAll();
  
// =======================================
//			CREATE CONTAINERS
// =======================================

  
//=============== Device Container ==================
	var dev = local.values.addContainer("Device");
	//	dev.setCollapsed(true);	
		dev.addBoolParameter("Flashing", "",false);
		r=dev.addStringParameter("Model Name", "","");
		r.setAttribute("readonly" ,true);
		r=dev.addStringParameter("Receiver ID", "","");
		r.setAttribute("readonly" ,true);
		r=dev.addStringParameter("RF Band", "","");
		r.setAttribute("readonly" ,true);
		r=dev.addStringParameter("Lock Status", "","");
		r.setAttribute("readonly" ,true);
		r=dev.addStringParameter("Menu Lock", "","");
		r.setAttribute("readonly" ,true);
		r=dev.addStringParameter("FW Version", "","");
		r.setAttribute("readonly" ,true);
		
//============== Channels Container ==================
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 var chan = local.values.addContainer("Channel 1");
		chan.setCollapsed(true);
			chan.addBoolParameter("Flashing", "",false);
			chan.addTrigger("Update", "Request all the Values from the Hardware !!" , false);		
		var champs = util.getObjectProperties(contain);
		for (var n = 0; n < champs.length; n++) {
			if (contain[champs[n]][1] == "s") {
			p=chan.addStringParameter(contain[champs[n]][0], "", ""); 
			p.setAttribute("readonly" ,true);}
			else if (contain[champs[n]][1] == "f2") {
			p=chan.addFloatParameter(contain[champs[n]][0], "", -120,-120,-1);
			p.setAttribute("readonly" ,true);}							
			else if (contain[champs[n]][1] == "f3") {
			p=chan.addFloatParameter(contain[champs[n]][0], "", 0,0,5); 
			p.setAttribute("readonly" ,true);} }			
			p=chan.addEnumParameter("Battery Bars", "Battery Bars","unknown","255","5/5 full","5","4/5 bars","4","3/5 bars","3","2/5 bars","2","1/5 bars","1","0/5 alerte !", "0");
			p.setAttribute("readonly" ,true);
			
	var chan = local.values.addContainer("Channel 2");
		chan.setCollapsed(true);
			chan.addBoolParameter("Flashing", "",false);
			chan.addTrigger("Update", "Request all the Values from the Hardware !!" , false);	
		var champs = util.getObjectProperties(contain);
		for (var n = 0; n < champs.length; n++) {
			if (contain[champs[n]][1] == "s") {
			p=chan.addStringParameter(contain[champs[n]][0], "", ""); 
			p.setAttribute("readonly" ,true);}			
			else if (contain[champs[n]][1] == "f1") {
			p=chan.addFloatParameter(contain[champs[n]][0], "", 0,0,120); 
			p.setAttribute("readonly" ,true);}			
			else if (contain[champs[n]][1] == "f2") {
			p=chan.addFloatParameter(contain[champs[n]][0], "", -120,-120,-1);
			p.setAttribute("readonly" ,true);}			
			else if (contain[champs[n]][1] == "f3") {
			p=chan.addFloatParameter(contain[champs[n]][0], "", 0,0,5); 
			p.setAttribute("readonly" ,true);} }			
			p=chan.addEnumParameter("Battery Bars", "Battery Bars","unknown","255","5/5 full","5","4/5 bars","4","3/5 bars","3","2/5 bars","2","1/5 bars","1","0/5 alerte !", "0");
			p.setAttribute("readonly" ,true);	
}

function update(delta) {
  if (local.values.device.flashing.get()) {
    device_flashtime += 0.5;
    if (device_flashtime >= flashtime) {
      device_flashtime = 0;
      local.values.device.flashing.set(0);
    }
  }
  if (local.values.channel1.flashing.get()) {
    channel_1_flashtime += 0.5;
    if (channel_1_flashtime >= flashtime) {
      channel_1_flashtime = 0;
      local.values.channel1.flashing.set(0);
    }
  }
  if (local.values.channel2.flashing.get()) {
    channel_2_flashtime += 0.5;
    if (channel_2_flashtime >= flashtime) {
      channel_2_flashtime = 0;
      local.values.channel2.flashing.set(0);
    }
  }
}

// =======================================
//			HELPER
// =======================================

function toInt(input) {
  //function is used to parse strings with leading 0 to int, parseInt assumes a number in octal representation due to the leading 0, so 05000 becomes 2560. with this function 05000 will be parsed as 5000.
  string = input;
  notNull = false;
  res = "";
  for (indx = 0; indx < string.length; indx++) {
    char = string.substring(indx, indx + 1);
    if (char != 0 || notNull) {
      res += char;
      notNull = true;
    }
  }

  return parseInt(res);
}

// =======================================
//			DATA RECEIVED
// =======================================

function dataReceived(inputData) {
  // example of incoming messages:
  // < REP x GROUP_CHANNEL {6,100} >  |  x is repolaced by the channel number
  // < REP x CHAN_NAME {yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy} >
  // < REP MODEL {SLXD4yyyyyyyyyyyyyyyyyyyyyyyyyyy} >
  // < SAMPLE 1 ALL 102 102 086 >
  // it is possible that we receive multiple messages in one data packet, we need to split them

  splitData = inputData.split(">");
  for (item = 0; item < splitData.length; item++) {
    data = splitData[item];
    // Removing the surrounding "<" and ">"
    trimmedStr = data.substring(2, data.length - 1);
    // remove possible string answers
    if (trimmedStr.indexOf("{") > -1) {
      string = trimmedStr.substring(
        trimmedStr.indexOf("{"),
        trimmedStr.indexOf("}") + 1
      );
      trimmedStr = trimmedStr.replace(string, "");
      string = string.replace("{", "").replace("}", "");
    }

    // Splitting the string by spaces
    parts = trimmedStr.split(" ");

    if (parts[0] == "REP") {
      //message is a return value from the receiver
      //TODO: do something with it
      //script.log(parts[2]);

// =======================================
// 				DEVICE INFOS 
// =======================================
      
      if (parts[1] == "MODEL") {
        local.values.device.modelName.set(string);
      }
      if (parts[1] == "DEVICE_ID") {
        local.values.device.receiverID.set(string);
        last_received["receiverID"] = util.getTime();
      }
      if (parts[1] == "FW_VER") {
        local.values.device.fwVersion.set(string);
      }
      if (parts[1] == "RF_BAND") {
        local.values.device.rfBand.set(string);
      }
      if (parts[1] == "LOCK_STATUS") {
        local.values.device.lockStatus.set(parts[2]);
      }
      if (parts[1] == "FLASH") {
        if (parts[2] == "ON") {
          local.values.device.flashing.set(true);
        } else {
          local.values.device.flashing.set(false);
        }
      }
// =======================================
//			 CHANNEL INFOS 
// =======================================

      if (parts[2] == "FLASH") {
        if (parts[3] == "ON") {
          local.values.getChild("channel" + parts[1]).flashing.set(true);
        } else {
          local.values.getChild("channel" + parts[1]).flashing.set(false);
        }
      }
      if (parts[2] == "CHAN_NAME") {
        key = "channel" + parts[1] + ".name";
        last_received[key] = util.getTime();
        local.values
          .getChild("channel" + parts[1])
          .getChild("chanName")
          .set(string);
      }
      if (parts[2] == "METER_RATE") {
        local.parameters.getChild("updateRateCh" + parts[1]).setData(parts[3]);
      }
      if (parts[2] == "GROUP_CHANNEL") {
        grp_info = string.split(",");
        local.values
          .getChild("channel" + parts[1])
          .rfGroup.set(grp_info[0]);
        local.values
          .getChild("channel" + parts[1])
          .rfChannel.set(grp_info[1]);
      }
      if (parts[2] == "AUDIO_GAIN") {
        if (parts[3][0] == 0) {
          parts[3] = parts[3].substring(1, parts[3].length);
        }
        key = "channel" + parts[1] + ".audioGain";
        last_received[key] = util.getTime();
        var gain = parseInt(parts[3]) - 18 ;
        local.values
          .getChild("channel" + parts[1])
          .audioGain.set(gain+" db");
      }
      if (parts[2] == "AUDIO_LEVEL_RMS") {
        local.values
          .getChild("channel" + parts[1])
          .audioLevelRMS.set(parseFloat(parts[3]) - 120);
      }
      if (parts[2] == "AUDIO_LEVEL_PEAK") {
      var parsepeak = parseFloat(parts[3]) - 120 ;
        local.values
          .getChild("channel" + parts[1])
          .audioLevelPeak.set(parsepeak);
          if (parsepeak < -60){ var dbfs = "NO SIGNAL !" ;  }
          else {
          var dbfs = parsepeak+" dbFS" ;           }
          local.values
          .getChild("channel" + parts[1])
          .audioPeak.set(dbfs);
      }
      if (parts[2] == "RSSI") {
      var rfparse = parseFloat(parts[3]) - 120 ;
      if (rfparse < -70) {rssi = "RF TOO LOW !" ;}
      else{
      var rssi = rfparse+" dbm" ;}
      	local.values
          .getChild("channel" + parts[1])
          .rf.set(rssi);
        local.values
          .getChild("channel" + parts[1])
          .rfLevel.set(rfparse);
      }
      if (parts[2] == "AUDIO_OUT_LVL_SWITCH") {
        local.values
          .getChild("channel" + parts[1])
          .audioLevelSwitch.set(parts[3]);
      }
      if (parts[2] == "FREQUENCY") {
        dec = parts[3].substring(parts[3].length - 3, parts[3].length);
        lead = parts[3].substring(0, parts[3].length - 3);
        if (lead[0] == 0) {
          lead = lead.substring(1, lead.length);
        }
        local.values
          .getChild("channel" + parts[1])
          .frequency.set(lead + "." + dec);
      }
      if (parts[2] == "TX_BATT_BARS") {
      var charge = parseFloat(parts[3]) ;
        local.values
          .getChild("channel" + parts[1])
          .batteryBars.setData(parseInt(parts[3]));
          local.values
          .getChild("channel" + parts[1])
          .batteryCharge.set(charge);
      }
      if (parts[2] == "TX_MODEL") {
        local.values
          .getChild("channel" + parts[1])
          .transmitter.set(parts[3]);
      }
      if (parts[2] == "TX_BATT_MINS") {

        mins = parseInt(parts[3]);
        if (mins <= 65532) {
          hrs = Math.floor(mins / 60);
          min = mins - hrs * 60;
          lbl = hrs + " hrs " + min + " min";
        } else if (mins == 65533) {
          lbl = "Battery communication warning";
        } else if (mins == 65534) {
          lbl = "Battery time calculating";
        } else if (mins == 65535) {
          lbl = "WORKS ONLY WITH SB900 !";
        }
        local.values.getChild("channel" + parts[1]).batteryRuntime.set(lbl);
      }
    } else if (parts[0] == "SAMPLE") {
      if (parts[2] == "ALL") {
      
        //Level Peak
        var parsepk = parseFloat(parts[3]) -120 ;
        local.values
          .getChild("channel" + parts[1])
          .audioLevelPeak.set(parsepk);
         if (parsepk <= -60)
        	{var level = " NO SIGNAL !" ;}
        	else if (parsepk > -6 && parsepk < -2)
        	{level = level+" dbFS -> Limit!" ;}
        	else if (parsepk >= -2 )
        	{level = parsepk+" dbFS -> Clip !!" ;}
        	else {level = parsepk+" dbFS" ;}
        local.values
          .getChild("channel" + parts[1])
          .audioPeak.set(level);
          
        //Level RMS
        local.values
          .getChild("channel" + parts[1])
          .audioLevelRMS.set(parseFloat(parts[4]) - 120);
          
        //RSSI
        var rfparse = parseFloat(parts[5]) -120 ;
        if (rfparse > -5) {var rssi = rfparse+" dbm -> Overload!" ;}
        else{
        rssi = rfparse+" dbm" ;}
        local.values
          .getChild("channel" + parts[1])
          .rfLevel.set(rfparse);
        local.values
          .getChild("channel" + parts[1])
          .rf.set(rssi);
      }
    }
  }
}

// =======================================
// 				PARAM CHANGE
// =======================================

function moduleParameterChanged(param) {
  //script.log(param.name + " parameter changed, new value: " + param.get());
  //root.modules.shureSLX_D.parameters.output.isConnected
  if (param.name == "isConnected" && param.get() == 1) {
    getAll();
  }
  if (param.name == "updateRateCh1") {
    setMeterRate(1, param.get());
  }
  if (param.name == "updateRateCh2") {
    setMeterRate(2, param.get());
  }
}

// =======================================
// 				 VALUE CHANGE 
// =======================================

function moduleValueChanged(value) {

	if (value.name == "update") {
      local.send("< GET 0 ALL >");
    }
  if (value.getParent().name == "device") {
    if (value.name == "flashing" && value.get() == 1) {
      setFlashing(0); //flash channel 0 aka device
    }
    if (value.name == "deviceID") {
      key = "deviceID";
      if (last_received[key] < util.getTime() - 0.5) {
        setDeviceID(value.get());
      }
    }
  }
  if (value.getParent().name.substring(0, 7) == "channel") {
    channel = value.getParent().name.substring(7, 8);
    if (value.name == "flashing" && value.get() == 1) {
      setFlashing(channel);
    }
    if (value.name == "name") {
      key = "channel" + channel + ".name";
      if (last_received[key] < util.getTime() - 0.5) {
        setChannelName(channel, value.get());
      }
    }
    if (value.name == "audioGain") {
      key = "channel" + channel + ".audioGain";
      if (last_received[key] < util.getTime() - 0.5) {
        //only send a message when we have not received a value in a while
        setAudioGain(channel, value.get());
      }
    }
  }
}

// =======================================
// 				 REQUESTS 
// =======================================

function requestModel() {
  local.send("< GET MODEL >");
}

function requestDeviceID() {
  local.send("< GET DEVICE_ID >");
}

function requestRfBand() {
  local.send("< GET RF_BAND >");
}

function requestLockState() {
  local.send("< GET LOCK_STATUS >");
}

function requestFwVersion() {
  local.send("< GET FW_VER >");
}

function requestChName(ch) {
  local.send("< GET " + ch + " CHAN_NAME >");
}

function requestChAGain(ch) {
  local.send("< GET " + ch + " AUDIO_GAIN >");
}

function requestChAudioOutLvlSwitch(ch) {
  local.send("< GET " + ch + " AUDIO_OUT_LVL_SWITCH >");
}

function requestChGroup(ch) {
  local.send("< GET " + ch + " GROUP_CHANNEL >");
}

function requestChFreq(ch) {
  local.send("< GET " + ch + " FREQUENCY >");
}

function getAll() {
  local.send("< GET 0 ALL >");
  //Message received : < GET 0 ALL >< SET 0 METER_RATE 5000 > //companion init
}

function requests(string) {
  local.send(string);
}


// =======================================
//  			 COMMANDS 
// =======================================

function setFlashing(ch) {
  if (typeof ch == "undefined" || ch == 0) {
    local.send("< SET FLASH ON >");
  } else if (ch == 1 || ch == 2) {
    local.send("< SET " + ch + " FLASH ON >");
  }
}

function sendLine(line) {
    local.send(line );
}

function setDeviceID(newid) {
  local.send("< SET DEVICE_ID {" + newid + "} >");
}

function setChannelName(ch, newName) {
  if (ch == 1 || ch == 2) {
    local.send(
      "< SET " + ch + " CHAN_NAME {" + newName.substring(0, 8) + "} >"
    );
  }
}

function setAudioGain(ch, gain) {
  //< SET x AUDIO_GAIN 40 >
  if (ch == 1 || ch == 2) {
    local.send("< SET " + ch + " AUDIO_GAIN " + (gain + 18) + " >");
  }
}

function incAudioGain(ch, addgain) {
  //< SET x AUDIO_GAIN 40 >
  if (ch == 1 || ch == 2) {
    local.send("< SET " + ch + " AUDIO_GAIN INC " + addgain + " >");
  }
}

function decAudioGain(ch, addgain) {
  //< SET x AUDIO_GAIN 40 >
  if (ch == 1 || ch == 2) {
    local.send("< SET " + ch + " AUDIO_GAIN DEC " + addgain + " >");
  }
}

function setMeterRate(ch, rate) {
  rate = toInt(rate);
  //< SET x METER_RATE 01000 >
  if ((ch == 1 || ch == 2) && ((rate >= 100 && rate <= 65535) || rate == 0)) {
    local.send("< SET " + ch + " METER_RATE " + rate + " >");
  }
}
