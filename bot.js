var Botkit = require('botkit');
var At = require('node-at');
var Schedule = require("node-schedule");

// デバッグログ出力フラグ.
const controller = Botkit.slackbot({
  debug: true
});

const key_schedule = "schedule";
const key_member = "member";

// お掃除スケジュールの配列定義.
var _schedules = [
  "09:50",
  "10:50",
  "11:50",
  "12:50",
  "13:50",
  "14:50",
  "15:50",
  "16:50"
];

// (IoTS) Slack API Token.
var _apiToken = require('./apitoken.json').apiToken;

// Bot Controller 生成.
var _bot = controller.spawn({
  token: _apiToken
}).startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.on('rtm_close', (bot, err) => {
  console.log('controller.on : rtm_close');
  reStartRTM();
});

controller.hears(['今日は掃除の日です'],['ambient'],function(bot,message) {
  bot.reply(message, createReply());
});

controller.hears(['お掃除'],['direct_message','direct_mention','mention'],function(bot,message) {
  bot.reply(message, createReply());
});

function createReply() {
  var osoujiSchedule = createOsoujiSchedule();
  var reply = 'ー本日のお掃除スケジュールはーーーーーーーーーー\n'
  for ( var i = 0; i < osoujiSchedule.length; ++i ) {
    var osouji = osoujiSchedule[i];
    var text = osouji.get(key_schedule) + " の担当者は " + osouji.get(key_member).user_id + " です。\n"
    // var text = osouji.get(key_member).user_id + " " + osouji.get(key_schedule) + " 掃除の担当です。\n";
    reply += text;
  }
  reply += "ーーーーーーーーーーーーーーーーーーーーーーーー"
  return reply;
}

// Botがなんらかの理由でkillされた場合にリスポーンするためのfunction.
function reStartRTM() {
  console.log('bot.reStartRTM !!!');
  bot.startRTM(function(err,_bot,payload) {
    if (err) {
      throw new Error('Could not connect to Slack');
    }
  });
}

function createOsoujiSchedule() {
  var members = readMemberFile();
  var totalMember = [];
  console.log('Osouji members: %d人', members.length);
  console.log('Osouji members: %j', members);
  for (var i = 0; i < members.length; ++i) {
    totalMember.push(members[i]);
  }
  if (members.length < _schedules.length) {
    // メンバーが足りない場合.
    need = _schedules.length - members.length;
    console.log('%d人足りない！', need);
    var appendixMember = appendixOsoujiMember(members, need);
    console.log('Osouji appendix members: %d人', appendixMember.length);
    console.log('Osouji appendix members: %j', appendixMember);
    for (var i = 0; i < appendixMember.length; ++i) {
      totalMember.push(appendixMember[i]);
    }
  }
  console.log('Osouji total members: %d人', totalMember.length);
  console.log('Osouji total members: %j', totalMember);
  var shuffled = shuffle(totalMember);
  var osoujiSchedule = [];
  for ( var i = 0; i < _schedules.length; ++i ) {
    var osouji = new Map();
    osouji.set(key_schedule, _schedules[i]);
    osouji.set(key_member, totalMember[i]);
    osoujiSchedule.push(osouji);
  }
  return osoujiSchedule;
}

/**
 * メンバー一覧のjsonファイルを読み込む.
 * 除外フラグ(exclusion)が立っていないメンバーのみのArrayを返す.
 */
function readMemberFile() {
  delete require.cache[__dirname + '/member.json']
  var file = require('./member.json');
  var array = file.memberlist;
  var length = array.length;
  for (var i = length - 1; i >= 0; i--) {
    var member = array[i];
    if (member.exclusion > 0) {
      array.splice(i, 1);
      length =- 1;
    }
  }
  return array;
}

function appendixOsoujiMember(source, need) {
  var array = [];
  for (var i = 0; i < source.length; ++i ) {
    array.push(source[i]);
  }
  var appendixMember = [];
  var length = array.length;
  for ( var i = 0; i < need; ++i ) {
    var r = Math.floor(Math.random() * length);
    appendixMember.push(array[r]);
    console.log('need %d人目を追加', (i + 1));
    array.splice(r, 1);
    length--;
    console.log('length 残り%d人', length);
    if (length < 1) {
      console.log('length 補充要');
      for (var k = 0; k < source.length; ++k ) {
        array.push(source[k]);
      }
      length = array.length;
      console.log('length 補充後 残り%d人', length);
    }
  }
  return appendixMember;
}

/**
 * 配列をシャッフルする.
 */
function shuffle(array) {
  var n = array.length, t, i;
  while (n) {
    i = Math.floor(Math.random() * n--);
    t = array[n];
    array[n] = array[i];
    array[i] = t;
  }
  return array;
}
