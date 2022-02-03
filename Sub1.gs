//質問回答機能
function replyFromSheet(e) {
  //シートの最終行を取得
  var lastRow = faq.getLastRow();
  //シートの受信語句と返信語句を二次元配列で取得
  var wordList = faq.getRange(1,1,lastRow,2).getValues();
  //受信したメッセージ情報を変数に格納
  var text = e.message.text;
  //返信語句用の配列
  var replyTextList = [];

  //受信語句とシートの語句が同じ場合、返信語句をpush
  for(var i=1;i<wordList.length; i++){
    if(wordList[i][0] == text){
      replyTextList.push(wordList[i][1]);
    }
  }

  //解答できない場合、解答が多すぎる場合の処理
  if(replyTextList.length < 1){
    return "その語句は残念ながら返答リストにありません。\n先輩に直接聞いてみてください。";
  }else if(replyTextList.length > 5){
    var messageLength = 5;
  }else{
    var messageLength = replyTextList.length;
  }

  var messageArray = ["以下が回答です。"];
  for(var j=0;j<messageLength; j++){
    messageArray.push(replyTextList[j]);
  }

  return messageArray;
}  

//フォーム送信時メッセージが送られようにトリガー作成関数
function createTrigger (){
  var entry_form = FormApp.openById('18WDUZNaLOgTtvULLAdhugBbuXfsKTFynbpcchC73WuQ');
  ScriptApp.newTrigger("pushContactForm").forForm(entry_form).onFormSubmit().create();
}

//フォームからプッシュ送信する機能
function pushMessageFromForm (e) {
  try{
    var postbackData = e.postback.data.split("=");
    var lastRow = reserve_record.getLastRow();
    var formidList = reserve_record.getRange(1,1,lastRow,1).getValues();
    if(formidList.length == 1){
      return "送信予約が存在していませんでした。" ;
    }

    for(var i=1; i<=formidList.length; i++){
      if(formidList[i][0] == postbackData[0]){       
        //NOだった場合
        if(postbackData[1] == "NO"){      
          reserve_record.deleteRow(i+1);
          return "送信予約をキャンセルしました。";

        //YESだった場合
        }else if(postbackData[1] == "YES"){
          //userdata_sort から登録者の名前とIDを取得
          var namelastRow = ud_sort.getRange(1, 5).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
          var nameLists = ud_sort.getRange(2,5,namelastRow-1).getValues();
          var idList = ud_sort.getRange(2,2,namelastRow-1,1).getValues();

          //登録者名リストを一次元配列にする
          var nameList = [];
          for(var t=0; t<nameLists.length; t++){
            nameList.push(nameLists[t][0]);
          }

          //送信フォームの回答を取得
          var formResp = push_form.getResponse(postbackData[0]);
          var itemResp = formResp.getItemResponses();
          var pushMembers = itemResp[2].getResponse().split("\n");
          var pushContent = itemResp[3].getResponse();

          //IDが見つからなかった人を格納する配列
          var error_nameList = [];

        　//送信者のIDを格納する
          var targetIDs = [];
          for(var k=0; k<pushMembers.length; k++){
            for(var t=0; t<nameList.length; t++){
              if(nameList[t] == pushMembers[k]){
                targetIDs.push(idList[t][0]);
                break;
              }
              if(t == nameList.length - 1){
                //IDが見つからなければ格納
                error_nameList.push(pushMembers[k]);
              }
            }
          }

          if(targetIDs.length == 0){
            reserve_record.deleteRow(i+1);
            return "送信者が見つかりませんでした。公式LINEを追加してもらうか、直接連絡してください。";
          }
          //メッセージを送信
          pushMessage(targetIDs,pushContent);
          
          //送信元への報告メッセージ
          var toSender = ["送信が完了しました。"]
          if(error_nameList.length != 0){
            var text = "以下の人には送信ができませんでした。公式LINEを追加してもらうか、直接連絡してください。\n--------------"
            for(var t=0; t<error_nameList.length; t++){
              text = text + "\n" + error_nameList[t];
            }
            toSender.push(text);
          }

          //予約記録を削除
          reserve_record.deleteRow(i+1);
          return toSender;

        }else {
          return "エラーが発生しました。";
        }
      }
    }
    return "送信予約が存在していませんでした。" ;

  }catch(e){
    console.error(e.message);
    pushMessage(adminID,e.message);
  }
}

function pushEntryForm (e) {
  var entry_form = FormApp.openById('1DQ1IROcKS16lGqmxzt6MiOyB1DO6JofEaXv53avIurk');
  //userdata_sort から登録者の名前とIDを取得
  var namelastRow = ud_sort.getRange(1, 5).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  var nameLists = ud_sort.getRange(2,5,namelastRow-1).getValues();
  var idList = ud_sort.getRange(2,2,namelastRow-1,1).getValues();

  //登録者名リストを一次元配列にする
  var nameList = [];
  for(var i=0; i<nameLists.length; i++){
    nameList.push(nameLists[i][0]);
  }

  //送信フォームの回答を取得
  var itemResp = e.response.getItemResponses();
  var sender = itemResp[0].getResponse();
  var junre_num = itemResp[4].getResponse();
  
  //送信元の人のIDを格納する
  var senderID = -1
  for(var i=0; i<nameList.length; i++){
    if(nameList[i] == sender){
      senderID = idList[i][0];
      break;
    }
    if(i == nameList.length - 1){
      return;
    }
  }

  if(junre_num == "0"){
    pushMessage(senderID,"玉見山祭 エントリー完了しました。")
  }else{
    var firstjunre = itemResp[5].getResponse();
    var secondjunre = itemResp[7].getResponse();
    var thirdjunre = itemResp[9].getResponse();
    var fourthjunre = itemResp[11].getResponse();
    var fifthjunre = itemResp[13].getResponse();

    var text = ["玉見山祭 エントリー完了しました。エントリーは以下の通りです。","名前："+sender+"\n希望ジャンル数："+ junre_num +"\n第1希望："+firstjunre+"\n第2希望："+secondjunre+"\n第3希望："+thirdjunre+"\n第4希望："+fourthjunre+"\n第5希望："+fifthjunre,"エントリー情報が誤っていた場合は、もう一度回答してください。"];
    pushMessage(senderID,text);
  }
}

function pushConfirmAction () {
  //userdata_sort から登録者の名前とIDを取得
  var namelastRow = ud_sort.getRange(1, 5).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  var nameLists = ud_sort.getRange(2,5,namelastRow-1).getValues();
  var idList = ud_sort.getRange(2,2,namelastRow-1,1).getValues();

  //登録者名リストを一次元配列にする
  var nameList = [];
  for(var i=0; i<nameLists.length; i++){
    nameList.push(nameLists[i][0]);
  }
  
  //送信フォームの回答を取得
  var formResps = push_form.getResponses();
  var formResp = formResps[formResps.length-1];
  var formResp_ID = formResp.getId();
  var itemResp = formResp.getItemResponses();
  var sender = itemResp[0].getResponse();
  var function_select = itemResp[1].getResponse();

  //送信元の人のIDを格納する
  var senderID = -1
  for(var i=0; i<nameList.length; i++){
    if(nameList[i] == sender){
      senderID = idList[i][0];
      break;
    }
    if(i == nameList.length - 1){
      pushMessage(adminID,sender + "さんが送信予約をしましたが、IDを確認できませんでした。");
      return;
    }
  }

  if(function_select == "メンションリスト"){
    var mentionNameList = itemResp[2].getResponse().split("\n");
    var lineNameList = ud_sort.getRange(2,4,namelastRow-1).getValues();

    for(var i=0; i<nameList.length; i++){
      //送信者のIDを格納する
        var mentionList = "\n";
        var error_nameList = "以下は公式LINEを登録していないため、LINE名がわかりませんでした。\n-----------";
        for(var k=0; k<mentionNameList.length; k++){
          for(var t=0; t<nameList.length; t++){
            if(nameList[t] == mentionNameList[k]){
              mentionList = mentionList + "@"+lineNameList[t][0]+"\n";
              break;
            }
            if(t == nameList.length - 1){
              //IDが見つからなければ格納
              error_nameList =error_nameList + "\n" + mentionNameList[k];
            }
          }
        }
    }

    if(mentionList == "\n"){
      pushMessage(senderID, "名簿のうち一人も登録していなかったため、メンションリストを作れませんでした。");
      return;
    }
    var text = ["以下をコピーして、メンションできる状態にし,送信してください。",mentionList]
    if(error_nameList != "以下は公式LINEを登録していないため、LINE名がわかりませんでした。\n-----------"){
      text.push(error_nameList);
    }
    
    pushMessage(senderID,text);
    
  }else{    
    var pushMembers = itemResp[2].getResponse().split("\n");
    var pushContent = itemResp[3].getResponse();

    var push_num = pushMembers.length;

    var headers = {
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": "Bearer " + channel_token,
    };
    var postData = {
        "to": senderID,
        "messages": [{
          "type": "flex",
          "altText": "メッセージ送信確認です。予約を確定するか選択してください。",
          "contents": {
            "type": "bubble",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "— メッセージ送信確認 ―",
                  "size": "16px",
                  "weight": "bold"
                }
              ]
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "〈送信内容〉"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "margin": "lg",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "予約者",
                          "color": "#aaaaaa",
                          "size": "sm",
                          "flex": 1
                        },
                        {
                          "type": "text",
                          "text": sender,
                          "wrap": true,
                          "color": "#666666",
                          "size": "sm",
                          "flex": 4
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "送信人数",
                          "color": "#aaaaaa",
                          "size": "sm",
                          "flex": 1
                        },
                        {
                          "type": "text",
                          "wrap": true,
                          "color": "#666666",
                          "size": "sm",
                          "flex": 3,
                          "text": push_num + "名"
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "内容",
                          "color": "#aaaaaa",
                          "size": "sm",
                          "flex": 1
                        },
                        {
                          "type": "text",
                          "wrap": true,
                          "color": "#666666",
                          "size": "sm",
                          "flex": 3,
                          "text": pushContent
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "separator",
                  "margin": "25px"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": "送信予約を実行しますか？",
                      "size": "sm",
                      "weight": "bold"
                    }
                  ]
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "spacing": "sm",
              "contents": [
                {
                  "type": "button",
                  "style": "link",
                  "height": "sm",
                  "action": {
                    "type": "postback",
                    "label": "はい",
                    "data": formResp_ID + "=YES",
                    "displayText": "送信を実行"
                  }
                },
                {
                  "type": "button",
                  "style": "link",
                  "height": "sm",
                  "action": {
                    "type": "postback",
                    "label": "いいえ",
                    "data": formResp_ID + "=NO",
                    "displayText": "送信をキャンセル"
                  }
                },
                {
                  "type": "spacer",
                  "size": "sm"
                }
              ],
              "flex": 0
            }
          }
        
      }]
    }
    const options = {
      "method": "post",
      "headers": headers,
      "payload": JSON.stringify(postData)
    };

    UrlFetchApp.fetch(push_url, options);
    reserve_record.appendRow([formResp_ID,sender,senderID,itemResp[1].getResponse(),pushContent]);

    return;
  }
}

//LINE名が被っていた場合などに、氏名からプロフィール画像を返す機能
function searchUserPicture (e) {
  const userID = e.source.userId;
  //userdata_sort から登録者の名前とIDを取得
  var namelastRow = ud_sort.getRange(1, 5).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  var nameLists = ud_sort.getRange(2,5,namelastRow-1).getValues();
  var idList = ud_sort.getRange(2,2,namelastRow-1,1).getValues();
  var lineNameList = ud_sort.getRange(2,4,namelastRow-1).getValues();

  //登録者名リストを一次元配列にする
  var nameList = [];
  for(var i=0; i<nameLists.length; i++){
    nameList.push(nameLists[i][0]);
  }

  var searchNameList = e.message.text.split("\n");
  console.log(searchNameList);
  
  for(var i=0; i<nameList.length; i++){
    //送信者のIDを格納する
      var userPictureList = "\n";
      var error_nameList = "以下は公式LINEを登録していないため、プロフィール画像がわかりませんでした。\n-----------";
      for(var k=0; k<searchNameList.length; k++){
        for(var t=0; t<nameList.length; t++){
          if(nameList[t] == searchNameList[k]){
            let userID = idList[t][0];
            let res = UrlFetchApp.fetch(`https://api.line.me/v2/bot/profile/${userID}`,
              {
                headers : {
                  "Content-Type": "application/json; charset=UTF-8",
                  "Authorization": "Bearer " + channel_token,
                },
                  "method" : "GET",
                }
              );
            let userPictureUrl = JSON.parse(res.getContentText()).pictureUrl;
            userPictureList = userPictureList + searchNameList[k] + "\n" + lineNameList[t][0] + "\n" + userPictureUrl + "\n\n";
            break;
          }
          if(t == nameList.length - 1){
            //IDが見つからなければ格納
            error_nameList =error_nameList + "\n" + searchNameList[k];
          }
        }
      }
  }

  if(userPictureList == "\n"){
    pushMessage(userID, "名簿のうち一人も登録していなかったため、プロフィール画像が検索できませんでした。");
    return;
  }
  console.log(userPictureList);
  var text = ["以下がユーザー名とプロフィール画像のリストです。",userPictureList]
  if(error_nameList != "以下は公式LINEを登録していないため、プロフィール画像がわかりませんでした。\n-----------"){
    text.push(error_nameList);
  }

  pushMessage(userID,text);
  return;
}

function pushContactForm (e) {
  //送信フォームの回答を取得
  var itemResp = e.response.getItemResponses();
  var sender = itemResp[0].getResponse();
  var sender_hira = itemResp[1].getResponse();
  var th = itemResp[2].getResponse();
  var content = itemResp[3].getResponse();

  var text = "意見箱に意見が来ました。\n\n名前（漢字）："+ sender + "\n名前（ひら）:" + sender_hira + "\n代：" + th + "\n意見：\n" + content;

  pushMessage(adminID,text);
  return;
}

//定期的にLINE名を更新する機能
function updateLineName () {
  //userdata_sort から登録者の名前とIDを取得
  var namelastRow = ud.getLastRow()
  var lineNameLists = [];
  var idList = ud.getRange(2,1,namelastRow-1,1).getValues();

  for(var i=0; i<idList.length; i++){
    let userID = idList[i][0];
    let res = UrlFetchApp.fetch(`https://api.line.me/v2/bot/profile/${userID}`,
      {
        headers : {
          "Content-Type": "application/json; charset=UTF-8",
          "Authorization": "Bearer " + channel_token,
        },
          "method" : "GET",
        }
      );
    let userDisplayName = JSON.parse(res.getContentText()).displayName;
    lineNameLists.push([userDisplayName]);
  }
  ud.getRange(2,3,namelastRow-1).setValues(lineNameLists);
  
}

