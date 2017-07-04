//Serve index.html in an embeddable format
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/*
retrieve events from the google calendar 'Schedule Printers'
TODO: Retrieve events based on users perferred printer
*/
function getEvents(printer, start, end) {
  var tzOff = 240 * 60000; // timezone offset for the zone the DME is in (for locality)
  var gEvents = CalendarApp.getCalendarById('ADD PRINTER CALENDAR ID HERE').getEvents(new Date(parseInt(start)), new Date(parseInt(end))); //retrieve calendar events in the date range of the users view
  var eventList = [];
  for(var events in gEvents)\{
    var event = new Object();
    if(gEvents[events].getTag("printer") == printer || printer == "none"){
      var user = gEvents[events].getTag("user");
      if(user === Session.getActiveUser().getEmail()){
        //if the event belongs to current user
        event.title = "You (" + user.substring(0, user.length-11) + ")";
        event.selectable = true;
      }
      else{
        //if the event does not belong to current user
        event.title = "Booked";
        event.selectable = false;
      }
      event.title += " - " + gEvents[events].getTag("printer");
      //format event info for the website calendar (JSON)
      event.start = gEvents[events].getStartTime().getTime() - tzOff; //.toISOString().substring(0,16);
      event.end = gEvents[events].getEndTime().getTime() - tzOff; //.toISOString().substring(0,16);
      event.printer = printer;
      event.color = getColor(gEvents[events].getTag("printer"));
      eventList.push(event);
    }
  }
  return eventList;
}

/*
retrieve list of active printers from google sheet\
*/
function getPrinters(){
  var sheet = SpreadsheetApp.openById('ADD PRINTER SPREADSHEET HERE');
  var list = sheet.getRange("A:C").getValues();
  var printerList = [];
  for (var data in list){
    if( list[data][0] != '' && list[data][2] == 'Online')
      printerList.push(list[data][0]);
  }
  return printerList;
}

/*
determine whether user is certified
*/
function getUserCertification(){
  var user = Session.getActiveUser().getEmail();
  var userSheet = SpreadsheetApp.openById('ADD USER SPREADSHEET HERE');
  var users = userSheet.getRange("C:C").getValues();
  for (var email in users) {
    if(users[email][0] == user){
      return true;
    }
  }
  return false;
}

function getUser(){
  return Session.getActiveUser().getEmail();
}

function getBookable(start, end, printer){
  var intersectingEvents = CalendarApp.getCalendarById('ADD PRINTER CALENDAR ID HERE').getEvents(new Date(start), new Date(end));
  if(intersectingEvents.length == 0)
    return true;
  for(var i in intersectingEvents){
    if(intersectingEvents[i].getTag("printer") === printer)
      return false;
  }
  return true;
}

function createBooking(start, end, printer){
  var event = CalendarApp.getCalendarById('ADD PRINTER CALENDAR ID HERE').createEvent(
    printer + " - " + getUser(), 
    new Date(start),
    new Date(end), 
    {
      guests: getUser(),
      sendInvites: true
    });
  event.setTag("printer", printer);
  event.setTag("user", getUser());
  
}
//Gets the color for a printer
function getColor(printer){
  Logger.log(printer);
  var printerRange = SpreadsheetApp.openById('ADD PRINTER SPREADSHEET HERE').getRange("A:A");
  var printers  = printerRange.getValues();
  for (var i in printers){
    if(printers[i][0] == printer){
      return printerRange.getBackgrounds()[i][0];
    }
  }
}
