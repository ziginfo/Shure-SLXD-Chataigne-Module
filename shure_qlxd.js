// =========== VARS ===========================
var channel_1_flashtime = 0;
var todo = false;
var string= "" ;
var ch = 1 ;

// =======================================
//			FUNCTION INIT
// =======================================

function init() {
  script.setUpdateRate(1);
  //request all value fields
  getAll();
}

function update(delta){
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
  // < REP x GROUP_CHANNEL {6,100} >  |  x is replaced by the channel number
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

// ========= Splitting the string by spaces ==========
    parts = trimmedStr.split(" ");

    if (parts[0] == "REP") {
      //message is a return value from the receiver
      //TODO: do something with it
      //script.log(parts[2]);

// =======================================
// 				DEVICE INFOS 
// =======================================
      if (parts[1] == "MODEL") {
        local.values.device.modellName.set("QLXD");
      }
      if (parts[1] == "DEVICE_ID") {
        local.values.device.deviceID.set(string);
      }
      
      if (parts[1] == "MAC_ADDR") {
        local.values.device.macAddress.set(parts[2]);
      }
      if (parts[1] == "FW_VER") {
        local.values.device.fwVersion.set(string);
      }
      if (parts[1] == "RF_BAND") {
        local.values.device.rfBand.set(string);
      }
      if (parts[1] == "LOCK_STATUS") {
        local.values.device.lockStatus.setData(string);
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
        local.values.channel1.getChild("name")
          .set(string);
      } 
      if (parts[2] == "TX_TYPE") {
        local.values.channel1.getChild("transmitter")
          .set(parts[3]);
      }
      if (parts[2] == "METER_RATE") {
        local.parameters.getChild("updateRateCh" + parts[1]).setData(parts[3]);
      }
      if (parts[2] == "GROUP_CHAN") {
      	var grp_chan = parts[3];
        grp_chan =  grp_chan.split(",");
          
        local.values.channel1.rfGroup.set(grp_chan[0]);
        local.values.channel1.rfChannel.set(grp_chan[1]);
      }
      if (parts[2] == "AUDIO_GAIN") {
          parts[3] = parts[3].substring(1, parts[3].length);
          var val = parseInt(parts[3]) - 18 ;
          val = val+" db" ;
        //root.modules.shureQLX_D.parameters.updateRateCh1
        local.values.channel1.audioGain.set(val);
      }
      if (parts[2] == "RX_RF_LVL") {
      var rfparse = parseFloat(parts[3]) ;
      	if (rfparse > 104) {rf = rfparse+" dBm - OverLoad!";}
         if (rfparse < 30) {rf = "RF too low !";}
         else {rf = rfparse+" dBm";}
        local.values.channel1.rfLevel.set(rf);
        local.values.channel1.rfLevelPeak.set(rfparse);
      }
               
      if (parts[2] == "AUDIO_LVL") {
      var parselvl = parseFloat(parts[3]);
      var level = parselvl - 50 ;
      var lvlstring = level+" dbFS" ;
     	local.values.channel1.audioLevel.set(level+" dbFS");
        local.values.channel1.audioLevelPeak.set(level);
      }
           
      if (parts[2] == "TX_RF_PWR") {
        local.values.channel1.rfPower.set(parts[3]);
      }
      
      if (parts[2] == "RF_ANTENNA") {
      	var ant = parts[3];
      	if (ant== "XX" || ant== "" ){ ant = "RF no antenna" ;}
      	if (ant== "AX"){ ant = "antenna A" ;}
      	if (ant== "XB"){ ant = "antenna B" ;}
        local.values.channel1.diversityAntenna.set(ant);
      }
      if (parts[2] == "FREQUENCY") {
        //root.modules.shureQLX_D.parameters.updateRateCh1
        //root.modules.shureQLX_D.values.channel1.audioLevelRMS
        dec = parts[3].substring(parts[3].length - 3, parts[3].length);
        lead = parts[3].substring(0, parts[3].length - 3);
        local.values.channel1.frequency.set(lead + "." + dec);
      }
      if (parts[1] == "ENCRYPTION") {
        local.values.channel1.encryption.set(parts[2]);
      }
       if (parts[2] == "BATT_TYPE") {
        //root.modules.shureQLX_D.values.channel1.batteryBars
        local.values.channel1.batteryType.set(parts[3]);
      }
      if (parts[2] == "BATT_BARS") {
      var charge = parseFloat(parts[3]) ;
      if ( charge > 5){charge = 0 ;}
        //root.modules.shureQLX_D.values.channel1.batteryBars
        local.values.channel1.batteryBars.setData(parseInt(parts[3]));
        local.values.channel1.batteryCharge.set(charge);
      }
      if (parts[2] == "TX_BATT_MINS") {
        //root.modules.shureQLX_D.values.channel1.batteryBars
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
          lbl = "UNKNOWN";
        }
        local.values.getChild("channel" + parts[1]).batteryRuntime.set(lbl);
      }
    } else if (parts[0] == "SAMPLE") {
      if (parts[2] == "ALL") {
      	//A/B Antenna
      	var ant = parts[3];
      	if (ant== "XX" || ant== "" ){ ant = "RF no antenna" ;}
      	if (ant== "AX"){ ant = "antenna A" ;}
      	if (ant== "XB"){ ant = "antenna B" ;}
        local.values.channel1.diversityAntenna.set(ant);
        
         //RF Level
         var rfparse = parseFloat(parts[4]) ;
         if (rfparse > 104) {rf = rfparse+" dBm - OverLoad!";}
         if (rfparse < 30) {rf = "RF too low !";}
         else {rf = rfparse+" dBm";}
        local.values.channel1.rfLevel.set(rf);
        local.values.channel1.rfLevelPeak.set(rfparse);
        
        //Audio Level Peak
        var parselvl = parseFloat(parts[5]) ;
		var level = parselvl - 50 ;
        if (level >= -10)
        {level = level+" dbFS - Clip!" ;}
        else {level = level+" dbFS" ;}
        var lvlstring = parselvl - 50 ;
        local.values.channel1.audioLevel.set(level);
        local.values.channel1.audioLevelPeak.set(lvlstring);
      }
    }
  }
}

function moduleParameterChanged(param) {
  //script.log(param.name + " parameter changed, new value: " + param.get());
  //root.modules.shureQLX_D.parameters.output.isConnected
  if (param.name == "isConnected" && param.get() == 1) {
    getAll();
  }
	  if (param.name == "updateRateCh1")
	  var value = local.parameters.updateRateCh1.get() ; 
	{local.send("< SET 1 METER_RATE " +value+ " >");}
}

function moduleValueChanged(value) {
  //script.log(value.name + " value changed, new value: " + value.get());
  //script.log("parent element: " + value.getParent().name);
  if (value.getParent().name == "device") {
    if (value.name == "flashing" && value.get() == 1) {
      setFlashing(0);
    }
    if (value.name == "deviceID") {
      setDeviceID(value.get());
    }
  }
  if (value.getParent().name.substring(0, 7) == "channel") {
    channel = value.getParent().name.substring(7, 8);
    if (value.name == "flashing" && value.get() == 1) {
      setFlashing(channel);
    }

  }
}

// =======================================
// 				 REQUESTS 
// =======================================

function requestModel() {
  //< GET MODEL >
  local.send("< GET MODEL >");
}

function requestDeviceID() {
  //< GET DEVICE_ID >
  local.send("< GET DEVICE_ID >");
}

function requestRfBand() {
  //< GET RF_BAND >
  local.send("< GET RF_BAND >");
}

function requestLockState() {
  //< GET LOCK_STATUS >
  local.send("< GET LOCK_STATUS >");
}

function requestFwVersion() {
  //< GET FW_VER >
  local.send("< GET FW_VER >");
}

function requestChName(ch) {
  //< GET x CHAN_NAME >
  local.send("< GET " + ch + " CHAN_NAME >");
}

function requestChAGain(ch) {
  //< GET x AUDIO_GAIN >
  local.send("< GET " + ch + " AUDIO_GAIN >");
}

function requestChAudioOutLvlSwitch(ch) {
  //< GET x AUDIO_OUT_LVL_SWITCH >
  local.send("< GET " + ch + " AUDIO_OUT_LVL_SWITCH >");
}

function requestChGroup(ch) {
  //< GET x GROUP_CHANNEL >
  local.send("< GET " + ch + " GROUP_CHANNEL >");
}

function requestChFreq() {
  //< GET x FREQUENCY >
  local.send("< GET " + ch + " FREQUENCY >");
}

function getAll() {
  local.send("< GET 1 ALL >");
  //Message received : < GET 0 ALL >< SET 0 METER_RATE 5000 > //companion init
}

// =======================================
//  			 COMMANDS 
// =======================================

function setDeviceID(newid) {
  local.send("< SET DEVICE_ID {" + newid + "} >");
}

function sendLine(line) {
    local.send(line );
}

function setChannelName(newName) {
    local.send(
      "< SET " + ch + " CHAN_NAME {" +newName+ "} >" );
}

function setAudioGain(gain) {
  //< SET x AUDIO_GAIN 40 > 
    local.send("< SET " + ch + " AUDIO_GAIN " + (gain + 18) + " >");

}

function incAudioGain(addgain) {
  //< SET x AUDIO_GAIN 40 >
    local.send("< SET " + ch + " AUDIO_GAIN INC " + addgain + " >");

}

function decAudioGain(addgain) {
  //< SET x AUDIO_GAIN 40 >
	local.send("< SET " + ch + " AUDIO_GAIN DEC " + addgain + " >");

}

function setMeterRate(rate) {
  rate = toInt(rate);
  //< SET x METER_RATE 01000 >
  if ((ch == 1 || ch == 2) && ((rate >= 100 && rate <= 65535) || rate == 0)) {
    local.send("< SET " + ch + " METER_RATE " + rate + " >");
  }
}
