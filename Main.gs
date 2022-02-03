var channel_token = "CHANNEL_TOKEN"
const reply_url = "https://api.line.me/v2/bot/message/reply"
const push_url = 'https://api.line.me/v2/bot/message/push';
const multi_url = 'https://api.line.me/v2/bot/message/multicast';
const adminID = 'ADMIN_ID';

var ss = SpreadsheetApp.openById("SPREADSHEET_ID");
var ud = ss.getSheetByName("userdata");
var gd = ss.getSheetByName("groupdata");
var faq = ss.getSheetByName("FAQ");
var log = ss.getSheetByName("log");
var ud_sort = ss.getSheetByName("userdata_sort");
var reserve_record = ss.getSheetByName("送信予約");
var push_form = FormApp.openById('FORM_ID');

 
function doPost(e) {
    var json = e.postData.contents;
    var events = JSON.parse(json).events;
    
    events.forEach(function(e) {
      var reply_message = "原因不明のエラーです。ブロックしてしばらくしてブロック解除してみてください。";
      switch(e.type){
        case "follow":
          console.log("follow action accepted");
          reply_message = follow(e);
          break;
        case "message":
        if(e.source.type == "user"){
          var status = confirmUserStatus(e);
            switch(status){
              case "followed":
                  console.log("register action runned");
                  reply_message = register(e);
                break;
              case "registered": 
                var receiveText = e.message.text; 
                if(receiveText == "辞書"){
                  if(changeUserStatus(e,"question") == 1){
                    reply_message = "知りたい語句を入力してください。";
                  }else{
                    console.log("error 1");
                    reply_message = "エラーが発生しました。";
                  }                
                }else if(receiveText == "ユーザー画像検索"){
                  if(changeUserStatus(e,"searchPicture") == 1){
                    reply_message = "検索したいユーザーの氏名を改行で区切って入力してください。\n例：\n山田太郎\n島田蒼也";
                  }else{
                    console.log("error 1");
                    reply_message = "エラーが発生しました。";
                  }
                }else if(receiveText == "意見箱"){
                  reply_message = "こちらのフォームに入力してください。\n-------------\nFORM_URL";
                }else{
                  console.log("not reply ")
                  return ;
                }
                break;　
              case "question":
                if(changeUserStatus(e,"registered") == 1){
                  reply_message = replyFromSheet(e);
                }else{
                  console.log("error 2");
                  reply_message = "エラーが発生しました。";
                }             
                break;
              case "searchPicture":
                if(changeUserStatus(e,"registered") == 1){
                  searchUserPicture(e);
                  return;
                }else{
                  console.log("error 3");
                  reply_message = "エラーが発生しました。";
                }
                break;
              case "":
                console.log("status is not found");
                reply_message = follow(e);
                break;
            }
          break;
        }else if(e.source.type == "group" || e.source.type == "room"){

        }else{
          pushMessage(adminID,"イベントタイプが判別できませんでした。");
          reply_message = "エラーが発生しました。";
        }
        case "join":
          if(e.source.type == "group") reply_message = registerGroup(e);
          else if(e.source.type == "room") reply_message = registerRoom(e);
        case "unfollow":
          unfollow(e);
          return ;
        case "postback":
          reply_message = pushMessageFromForm(e);
      }
    replyMessage(e,reply_message);
    });
  
}

//フォロー直後
function follow(e){
  try{
    var userID = e.source.userId;
    var status = "followed";

    var userdata = [`${userID}`,status];
    ud.appendRow(userdata);
    return ["フォローありがとうございます！\nD-mc用Line Botです！\nメンバー登録をお願いします！\n\n登録と始めに入力して、\n名前(漢字とひらがな)\n代\n生年月日\nを下記のように入力してください！","登録\n山田太郎\nやまだたろう\n26th\n2000年5月5日"];
  }catch(exec){
    console.error(exec.message);
    pushMessage(adminID,exec.message);
    return "エラーが発生しました。お手数ですがこのアカウントをブロック後、しばらくして解除してやり直してください。";
  }
} 

//登録機能
function register(e){
  try{
    //メッセージからユーザーIDと入力情報を取得し、「登録」の文字部分を削除、配列化
    var userID = e.source.userId;
    if(e.message.text.indexOf("\n") != -1){
      var info = e.message.text.split("\n");

    //参考通り入力しているかの確認
      if(info[0] == "登録" && info.length == 5){
        info.shift();
        var ary = [[`${userID}`,"registered"]];
        
        //表示名　本名等を配列に格納
        var res = UrlFetchApp.fetch(`https://api.line.me/v2/bot/profile/${userID}`,
        {
          headers : {
            "Content-Type": "application/json; charset=UTF-8",
            "Authorization": "Bearer " + channel_token,
          },
            "method" : "GET",
          }
        );
        var userDisplayName = JSON.parse(res.getContentText()).displayName;
        ary[0].push(userDisplayName);

        for (var i=0; i<info.length; i++) {
          ary[0].push(info[i]);
        }

        //userDataシートの最終行を取得、追加
        var lastRow = ud.getLastRow();
        var idList = ud.getRange(1,1,lastRow,1).getValues();

        for(var i=1; i<idList.length; i++){
          if(idList[i][0] == userID){
            ud.getRange(i+1,1,1,ary[0].length).setValues(ary);
            return "登録できました！\n入力ありがとうございます！";
          }
        }

        //userDataにIDがない場合
        ud.appendRow(ary[0]);
        return "登録できました！\n入力ありがとうございます！";

      }else{
        return ["下記のように登録と最初に入力して、送信してください。","登録\n山田太郎\nやまだたろう\n26th\n2000年5月5日"];
      }
    }else{
      return ["下記のように登録と最初に入力して、送信してください。","登録\n山田太郎\nやまだたろう\n26th\n2000年5月5日"];
    }
  }catch(exec){
    console.error(exec.message);
    pushMessage(adminID,exec.message);
    return ["エラーが発生しました。\nもう一度やり直してください。","下記のように入力してください。","登録\n山田太郎\nやまだたろう\n26th\n2000年5月5日"];
  }
}

//グループ参加時登録機能
function registerGroup(e) {
  const groupID = e.source.groupId;
  var res = UrlFetchApp.fetch(`https://api.line.me/v2/bot/group/${groupID}/summary`,
    {
      headers : {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + channel_token,
      },
      "method" : "GET",
    }
  );
  var groupName = JSON.parse(res.getContentText()).groupName;
  var registerGroup_array = [`${groupID}`,groupName,"group"]

  gd.appendRow(registerGroup_array);
  return "D-mcアカウントです。よろしくお願いします！";
}

function registerRoom(e) {
  const roomID = e.source.roomId;
  
  var registerGroup_array = [`${roomID}`,"","room"]

  gd.appendRow(registerGroup_array);
  return　"D-mcアカウントです。よろしくお願いします！";
}

//フォロー解除された場合の機能
function unfollow(e) {
  var userID = e.source.userId;
  var lastRow = ud.getLastRow();
  var idList = ud.getRange(1,1,lastRow,1).getValues();
  
  for(var i=1; i<idList.length; i++){
    if(idList[i][0] == userID){
      ud.deleteRow(i+1);
      return ;
    }
  }
  return ;
}

//メッセージ返信機能
function replyMessage(e,message) {
  if(Array.isArray(message) == false){
    messageArray = [{"type" : "text", "text": message}]
  }else if(Array.isArray(message) == true){
    messageArray = [];
    for(var i=0;i<message.length;i++){
      messageArray.push({"type" : "text", "text": message[i]});
    }
  }

  var headers = {
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Bearer " + channel_token,
  };
  var postData = {
    "replyToken": e.replyToken,
    "messages": messageArray
  };
  var options = {
    "method" : "post",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };

  UrlFetchApp.fetch(reply_url, options);
}

//メッセージ送信機能
function pushMessage(ids,message) {
  if(Array.isArray(message) == false){
    messageArray = [{"type" : "text", "text": message}]
  }else if(Array.isArray(message) == true){
    messageArray = [];
    for(var i=0;i<message.length;i++){
      messageArray.push({"type" : "text", "text": message[i]});
    }
  }

  if(Array.isArray(ids) == false){
    console.log("push1");
    var url = push_url;
  }else if(ids.length == 1){
    console.log("push2");
    var url = push_url
    ids = ids[0];
  }else{
    var url = multi_url;
  }
  
  var headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + channel_token,
  };
  var postData = {
      "to": ids,
      "messages": messageArray,
  };
  const options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };

  UrlFetchApp.fetch(url, options);
}

//ユーザーの現在状況の確認関数
function confirmUserStatus(e){
  var userId = e.source.userId;
  var lastRow = ud.getLastRow();
  var statusList = ud.getRange(1,1,lastRow,2).getValues();
  var status = "";

  for(var i=1; i<statusList.length; i++){
    if(statusList[i][0] == userId){
      status = statusList[i][1];
    }
  }
  return status;
}

//ユーザーの現在状況変更関数
function changeUserStatus(e,status){
  var userId = e.source.userId;
  var lastRow = ud.getLastRow();
  var idList = ud.getRange(1,1,lastRow,1).getValues();

  for(var i=1; i<=idList.length; i++){
    if(idList[i][0] == userId){
      ud.getRange(i+1,2).setValue(status);
      return 1;
    }
  }
  return 0;
} 

function execErrorDetails(error) {
  var resultMessage = "message:" + error.message + "\nfileName:" + error.fileName + "\nlineNumber:" + error.lineNumber + "\nstack:" + error.stack
  console.error(resultMessage)
  return resultMessage
}

