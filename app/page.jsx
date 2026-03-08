"use client"; 

import { useState, useRef, useEffect } from "react";

// ── 定数 ──────────────────────────────────────────────
const HEALTH_CONDITION_OPTIONS = [
  "高血圧","糖尿病","高コレステロール","貧血","胃腸が弱い",
  "アレルギー（乳製品）","アレルギー（小麦）","アレルギー（卵）",
  "骨粗しょう症","肝臓が弱い","腎臓が弱い",
];
const CONDITION_TAGS = ["普通","疲れ気味","運動してきた","体調不良"];
const APPETITE_TAGS  = ["お腹ぺこぺこ","胃腸を労わりたい","食欲がない"];
const PREF_TAGS      = ["あっさり系","こってり系","和食","洋食","中華"];

// 今日のモード
const DINNER_MODES = [
  { id: "special",  emoji: "🥂", label: "特別な日",    desc: "週末・記念日。手間をかけていいからご馳走を" },
  { id: "standard", emoji: "🍽️", label: "普通の日",    desc: "バランスよく、ほどよく手軽に" },
  { id: "weekday",  emoji: "⚡",  label: "時短・平日",  desc: "30分以内。栄養バランス重視でサクッと" },
  { id: "comfort",  emoji: "🛋️", label: "癒しメニュー",desc: "疲れた日。体にやさしくほっこりするものを" },
  { id: "diet",     emoji: "🥗", label: "ヘルシー",    desc: "カロリー控えめ、野菜多め、罪悪感なし" },
];

const MODE_INSTRUCTIONS = {
  special:  "今日は特別な日なので少し手間がかかっても豪華で見栄えのするご馳走メニューにしてください。ワンランク上の食材や盛り付けにも気を配ってください。",
  standard: "普通の日の夕食として栄養バランスよくほどよく手軽なメニューにしてください。",
  weekday:  "平日の時短夕食です。調理時間は合計30分以内を厳守し栄養バランスを最優先にしてください。品数は絞っても構いません。",
  comfort:  "疲れた日の癒しメニューです。体にやさしくほっこり温まるシンプルで作りやすいものにしてください。",
  diet:     "ヘルシー重視のメニューです。カロリー控えめ・野菜多め・脂質少なめで満足感もあるメニューにしてください。",
};

// 冷凍・常備品の候補
const FROZEN_OPTIONS = [
  "冷凍鶏もも肉","冷凍鶏むね肉","冷凍豚こま切れ","冷凍牛こま切れ",
  "冷凍エビ","冷凍シーフードミックス","冷凍サーモン","冷凍タラ",
  "冷凍枝豆","冷凍ほうれん草","冷凍ブロッコリー","冷凍コーン",
  "冷凍うどん","冷凍餃子","厚揚げ","豆腐","納豆","卵",
  "白米（常備）","食パン","パスタ","そうめん",
];
// 調味料・オイル・香辛料の候補
const SEASONING_OPTIONS = [
  "醤油","薄口醤油","味噌","みりん","料理酒","砂糖","塩","酢",
  "オリーブオイル","ごま油","サラダ油","バター",
  "鶏がらスープの素","和風だし","コンソメ","めんつゆ",
  "ケチャップ","マヨネーズ","ソース","ポン酢","豆板醤","オイスターソース","ナンプラー",
  "にんにく（チューブ）","生姜（チューブ）","わさび","からし",
  "一味唐辛子","七味","こしょう","カレー粉","クミン","パプリカパウダー",
];
// 生鮮品の一般候補（毎回選択 or 自由記入）
const FRESH_OPTIONS = [
  "玉ねぎ","じゃがいも","にんじん","キャベツ","白菜","ほうれん草","小松菜",
  "ブロッコリー","なす","ズッキーニ","トマト","きゅうり","ピーマン","パプリカ",
  "きのこ類","ごぼう","れんこん","大根","かぶ","アボカド","レモン",
  "鶏もも肉","鶏むね肉","豚バラ","豚こま","牛薄切り","合いびき肉",
  "サーモン","タラ","アジ","サバ","マグロ（刺身）","エビ",
  "豆腐（絹）","豆腐（木綿）","油揚げ","がんもどき",
];

// ── ストレージ (localStorage → メモリfallback) ─────────
let _mem = {};
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return _mem[k]??null; } },
  set: (k,v) => { try { localStorage.setItem(k,v); } catch { _mem[k]=v; } },
};
function loadJSON(key, def) {
  try { const v = store.get(key); return v ? JSON.parse(v) : def; } catch { return def; }
}

// ── 汎用コンポーネント ─────────────────────────────────
function Tag({ label, selected, onClick, color="teal", sm=false }) {
  const s = {
    teal:  selected?"bg-teal-600 text-white border-teal-600":"bg-white text-teal-700 border-teal-300 hover:border-teal-500",
    rose:  selected?"bg-rose-500 text-white border-rose-500":"bg-white text-rose-600 border-rose-300 hover:border-rose-400",
    amber: selected?"bg-amber-500 text-white border-amber-500":"bg-white text-amber-600 border-amber-300 hover:border-amber-400",
    slate: selected?"bg-slate-600 text-white border-slate-600":"bg-white text-slate-600 border-slate-300 hover:border-slate-400",
    red:   selected?"bg-red-400 text-white border-red-400":"bg-white text-red-500 border-red-300 hover:border-red-400 line-through opacity-60",
  };
  const sz = sm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <button onClick={onClick}
      className={`${sz} rounded-full border transition-all cursor-pointer select-none ${s[color]}`}>
      {label}
    </button>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1 items-center ml-1">
      {[0,1,2].map(i=>(
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{animationDelay:`${i*0.15}s`}}/>
      ))}
    </span>
  );
}

function SectionCard({ icon, title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
        <span>{icon}</span>{title}
        {sub && <span className="text-xs text-gray-400 font-normal ml-1">{sub}</span>}
      </h2>
      {children}
    </div>
  );
}

// ── 健康プロフィール モーダル ──────────────────────────
function ProfileModal({ onClose, init, initNote, onSave }) {
  const [sel, setSel] = useState(init);
  const [note, setNote] = useState(initNote);
  const toggle = c => setSel(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{background:"rgba(0,0,0,0.45)"}} onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 shadow-2xl"
        style={{maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-lg">🩺 健康プロフィール</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">登録しておくと毎回入力不要。年齢とともに自由に書き換えられます。</p>
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">💊 健康上の悩み（複数選択可）</div>
          <div className="flex flex-wrap gap-2">
            {HEALTH_CONDITION_OPTIONS.map(c=>(
              <Tag key={c} label={c} selected={sel.includes(c)} onClick={()=>toggle(c)} color="rose"/>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="text-sm font-semibold text-gray-700 mb-2">📝 その他・自由記入</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="例：塩分を控えたい、食物繊維を増やしたい、etc."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
            rows={3}/>
        </div>
        <button onClick={()=>{onSave(sel,note);onClose();}}
          className="w-full py-3 rounded-2xl bg-teal-500 text-white font-bold hover:bg-teal-600">
          保存する
        </button>
      </div>
    </div>
  );
}

// ── 食材ストック管理 モーダル ─────────────────────────
function StockModal({ onClose, initFrozen, initSeasonings, onSave }) {
  const [frozen, setFrozen] = useState(initFrozen);
  const [seasons, setSeasons] = useState(initSeasonings);
  const toggleF = i => setFrozen(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);
  const toggleS = i => setSeasons(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{background:"rgba(0,0,0,0.45)"}} onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 shadow-2xl"
        style={{maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-lg">🧊 食材ストック登録</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">常備・冷凍している食材と調味料を登録しておくと、毎回の入力が楽になります。</p>

        <div className="mb-5">
          <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            🧊 冷凍・常備品
          </div>
          <p className="text-xs text-gray-400 mb-2">冷凍庫・常温で常備しているもの</p>
          <div className="flex flex-wrap gap-2">
            {FROZEN_OPTIONS.map(i=>(
              <Tag key={i} label={i} selected={frozen.includes(i)} onClick={()=>toggleF(i)} color="slate"/>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-sm font-semibold text-gray-700 mb-1">🫙 調味料・オイル・香辛料</div>
          <p className="text-xs text-gray-400 mb-2">常備している調味料・スパイス類</p>
          <div className="flex flex-wrap gap-2">
            {SEASONING_OPTIONS.map(i=>(
              <Tag key={i} label={i} selected={seasons.includes(i)} onClick={()=>toggleS(i)} color="amber"/>
            ))}
          </div>
        </div>

        <button onClick={()=>{onSave(frozen,seasons);onClose();}}
          className="w-full py-3 rounded-2xl bg-teal-500 text-white font-bold hover:bg-teal-600">
          保存する
        </button>
      </div>
    </div>
  );
}

// ── チャットバブル ─────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role==="user";
  if (msg.type==="menu") {
    return (
      <div className="my-2">
        <div className="text-xs text-gray-400 mb-1 ml-8">献立AI ✨</div>
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-3 text-sm">
          <div className="font-bold text-teal-800 mb-1">🍽️ {msg.menu.menu_name}</div>
          <div className="text-teal-700 text-xs space-y-0.5">
            {msg.menu.dishes?.map((d,i)=>(
              <div key={i}>・{d.name}（{d.type}）</div>
            ))}
          </div>
          <div className="mt-2 text-xs text-teal-600 italic">{msg.menu.health_comment}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser?"justify-end":"justify-start"} my-1`}>
      {!isUser && <div className="text-base mr-1.5 self-end mb-0.5">🤖</div>}
      <div className={`max-w-xs sm:max-w-sm rounded-2xl px-3.5 py-2.5 text-sm shadow-sm leading-relaxed ${
        isUser?"bg-teal-500 text-white rounded-br-sm":"bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}`}>
        {msg.content}
      </div>
    </div>
  );
}

// ── 献立カード ──────────────────────────────────────────
function MenuCard({ menu, checkedItems, onToggleCheck, onCopy, onOpenTasks, copied }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-5 text-white shadow-lg"
        style={{background:"linear-gradient(135deg,#0d9488,#0369a1)"}}>
        <div className="text-xs font-medium opacity-75 mb-1">今夜のおすすめ献立</div>
        <div className="text-xl font-bold mb-2">{menu.menu_name}</div>
        <div className="flex flex-wrap gap-1.5">
          {(menu.nutrition_tags||[]).map(t=>(
            <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20">{t}</span>
          ))}
        </div>
        <div className="mt-2 text-xs opacity-75">⏱️ 合計 {menu.total_time}</div>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
        <div className="text-xs font-bold text-teal-700 mb-1">💬 栄養士からのコメント</div>
        <p className="text-sm text-teal-800 leading-relaxed">{menu.health_comment}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">🌈 彩り</div>
          <p className="text-xs text-gray-700">{menu.color_balance}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">👅 味</div>
          <p className="text-xs text-gray-700">{menu.taste_balance}</p>
        </div>
      </div>

      <div className="space-y-2">
        {menu.dishes?.map((dish,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium mr-2">{dish.type}</span>
                <span className="font-bold text-gray-800 text-sm">{dish.name}</span>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">⏱️{dish.cooking_time}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              {dish.ingredients?.map((ing,j)=>(
                <span key={j} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{ing}</span>
              ))}
            </div>
            {dish.nutrition_notes && (
              <p className="text-xs text-gray-500 border-t border-gray-50 pt-2 mt-1">💡 {dish.nutrition_notes}</p>
            )}
          </div>
        ))}
      </div>

      {menu.needed_ingredients?.length > 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-1 flex items-center gap-2 text-sm">
            <span>🛒</span> 買い物リスト
            <span className="ml-auto text-xs text-gray-400">{menu.needed_ingredients.length}品</span>
          </h3>
          <p className="text-xs text-gray-400 mb-3">タップでチェック</p>
          <div className="space-y-1 mb-3">
            {menu.needed_ingredients.map((item,i)=>(
              <button key={i} onClick={()=>onToggleCheck?.(item)}
                className={`w-full flex items-center gap-3 py-2 px-2 rounded-xl transition-all text-left ${checkedItems?.[item]?"bg-teal-50":"hover:bg-gray-50"}`}>
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  checkedItems?.[item]?"bg-teal-500 border-teal-500":"border-gray-300"}`}>
                  {checkedItems?.[item] && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`text-sm transition-all ${checkedItems?.[item]?"line-through text-gray-400":"text-gray-700"}`}>{item}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <button onClick={onCopy}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${
                copied?"bg-green-500 text-white":"bg-teal-500 text-white hover:bg-teal-600"}`}>
              {copied?<><span>✅</span><span>コピーしました！</span></>:<><span>📋</span><span>買い物リストをコピー</span></>}
            </button>
            <button onClick={onOpenTasks}
              className="w-full py-3 rounded-xl font-bold border-2 border-blue-400 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm transition-all">
              <span>✅</span><span>Google Tasksを開いて貼り付け</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-sm text-green-700 font-medium">家にある食材だけで全て作れます！</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  メインアプリ
// ══════════════════════════════════════════════════════
export default function DinnerPlanner() {
  // ── 永続データ ──
  const [savedCond,    setSavedCond]    = useState(()=>loadJSON("hc",[]));
  const [savedNote,    setSavedNote]    = useState(()=>store.get("hn")||"");
  const [savedFrozen,  setSavedFrozen]  = useState(()=>loadJSON("frozen",[]));
  const [savedSeasons, setSavedSeasons] = useState(()=>loadJSON("seasons",[]));

  // ── モーダル ──
  const [showProfile, setShowProfile] = useState(false);
  const [showStock,   setShowStock]   = useState(false);

  // ── ステップ ──
  const [step, setStep] = useState(1);

  // ── Step1: 今日の状態 ──
  const [bodyCond,  setBodyCond]  = useState("");
  const [appetite,  setAppetite]  = useState("");
  const [prefs,     setPrefs]     = useState([]);
  const [dinnerMode, setDinnerMode] = useState("");

  // ── Step2: 今日の食材 ──
  // 冷凍から「今日は切らしてる」を除外
  const [frozenOut, setFrozenOut] = useState([]); // savedFrozenから除外するもの
  // 生鮮品: 選択 + 自由記入
  const [freshSel,  setFreshSel]  = useState([]);
  const [freshFree, setFreshFree] = useState(""); // 自由記入
  const [freshInput,setFreshInput]= useState(""); // 入力中

  // ── Step3: チャット＆献立 ──
  const [menuResult,  setMenuResult]  = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput,   setChatInput]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const [checked,     setChecked]     = useState({});
  const chatEnd = useRef(null);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[chatHistory,chatLoading]);

  // ── 保存 ──
  function saveProfile(c,n) {
    setSavedCond(c); setSavedNote(n);
    store.set("hc",JSON.stringify(c)); store.set("hn",n);
  }
  function saveStock(f,s) {
    setSavedFrozen(f); setSavedSeasons(s);
    store.set("frozen",JSON.stringify(f)); store.set("seasons",JSON.stringify(s));
  }

  const toggle = (list,set,item) => set(p=>p.includes(item)?p.filter(x=>x!==item):[...p,item]);

  // ── 今日使える食材を構築 ──
  function buildAvailableIngredients() {
    const frozenAvail = savedFrozen.filter(i=>!frozenOut.includes(i));
    const freshFreeArr = freshFree.split(/[、,，\n]/).map(s=>s.trim()).filter(Boolean);
    const all = [...frozenAvail, ...freshSel, ...freshFreeArr, ...savedSeasons];
    return all;
  }

  // ── AIへのコンテキスト構築 ──
  function buildCtx() {
    const avail = buildAvailableIngredients();
    return [
      savedCond.length?`健康上の悩み: ${savedCond.join("、")}`:"健康上の悩み: 特になし",
      savedNote?`健康メモ: ${savedNote}`:"",
      bodyCond?`今日の体調: ${bodyCond}`:"体調: 未選択",
      appetite?`食欲: ${appetite}`:"食欲: 未選択",
      prefs.length?`今夜の気分: ${prefs.join("、")}`:"今夜の気分: 特になし",
      dinnerMode ? MODE_INSTRUCTIONS[dinnerMode] : "",
      avail.length?`使える食材（冷凍・生鮮・調味料込み）: ${avail.join("、")}`:"使える食材: 特になし",
    ].filter(Boolean).join("\n");
  }

  const schema = `{"menu_name":"献立名","dishes":[{"name":"料理名","type":"主菜|副菜|汁物|ご飯","ingredients":["食材(量)"],"cooking_time":"○分","nutrition_notes":"栄養ポイント"}],"health_comment":"コメント(2〜3文)","color_balance":"彩り(1行)","taste_balance":"味(1行)","nutrition_tags":["タグ"],"needed_ingredients":["買う必要がある食材"],"total_time":"合計時間"}`;

  async function generateMenu() {
    setLoading(true); setError("");
    const prompt = `あなたは栄養士兼料理家です。以下の条件で今夜の夕食献立を提案してください。\n\n${buildCtx()}\n\n次のJSON形式のみで返してください（マークダウン不要）:\n${schema}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setMenuResult(parsed); setChecked({});
      setChatHistory([{role:"assistant",type:"menu",menu:parsed}]);
      setStep(3);
    } catch { setError("献立の生成に失敗しました。もう一度お試しください。"); }
    finally { setLoading(false); }
  }

  async function sendChat() {
    if (!chatInput.trim()||chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    const newHist = [...chatHistory,{role:"user",type:"text",content:msg}];
    setChatHistory(newHist); setChatLoading(true);

    const sys = `あなたは栄養士兼料理家です。ユーザーの健康・体調を踏まえて献立を提案・修正します。\n\n【ユーザー情報】\n${buildCtx()}\n\n献立の修正・変更を求められた場合のみ、以下のJSON形式のみで返してください（説明文不要）:\n${schema}\n\nそれ以外は日本語で普通に会話してください。`;

    const messages = newHist.map(m=>({
      role:m.role,
      content:m.type==="menu"?`【現在の献立】${m.menu.menu_name}：${m.menu.dishes?.map(d=>d.name).join("、")}`:m.content
    }));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,system:sys,messages})
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const cleaned = text.replace(/```json|```/g,"").trim();
      let parsed = null;
      try { parsed = JSON.parse(cleaned); } catch {}
      if (parsed?.menu_name) {
        setMenuResult(parsed); setChecked({});
        setChatHistory(p=>[...p,{role:"assistant",type:"menu",menu:parsed}]);
      } else {
        setChatHistory(p=>[...p,{role:"assistant",type:"text",content:text}]);
      }
    } catch {
      setChatHistory(p=>[...p,{role:"assistant",type:"text",content:"エラーが発生しました。もう一度お試しください。"}]);
    } finally { setChatLoading(false); }
  }

  async function copyList() {
    if (!menuResult?.needed_ingredients?.length) return;
    const lines = [`🛒 買い物リスト｜${menuResult.menu_name}`,"",...menuResult.needed_ingredients.map(i=>`☐ ${i}`)];
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(()=>setCopied(false),3000); } catch {}
  }

  function reset() {
    setStep(1); setBodyCond(""); setAppetite(""); setPrefs([]); setDinnerMode("");
    setFrozenOut([]); setFreshSel([]); setFreshFree(""); setFreshInput("");
    setMenuResult(null); setChatHistory([]); setChecked({}); setError("");
  }

  function addFreshFree() {
    const v = freshInput.trim();
    if (!v) return;
    setFreshFree(p => p ? p+"、"+v : v);
    setFreshInput("");
  }

  const profileSummary = savedCond.length
    ? savedCond.join("・")+(savedNote?"など":"")
    : savedNote||"未登録";

  const stockSummary = [
    savedFrozen.length?`冷凍${savedFrozen.length}品`:"",
    savedSeasons.length?`調味料${savedSeasons.length}品`:"",
  ].filter(Boolean).join("・")||"未登録";

  // ── 描画 ────────────────────────────────────────────
  return (
    <div className="min-h-screen"
      style={{background:"linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 40%,#f0f9ff 100%)",
        fontFamily:"'Hiragino Kaku Gothic Pro','Meiryo',sans-serif"}}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 shadow-sm"
        style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)"}}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="text-2xl">🍽️</div>
          <div>
            <div className="font-bold text-gray-800" style={{fontSize:"1.05rem"}}>今夜の献立AI</div>
            <div className="text-xs text-gray-500">体調・栄養・彩りを考えた夕食提案</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={()=>setShowProfile(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-100 transition-all">
              🩺 健康
            </button>
            <button onClick={()=>setShowStock(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-all">
              🧊 食材
            </button>
            <div className="flex items-center gap-1 ml-1">
              {[1,2,3].map(s=>(
                <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step>=s?"bg-teal-500 text-white":"bg-gray-200 text-gray-400"}`}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

        {/* ══ STEP 1: 今日の状態 ══ */}
        {step===1 && (
          <div className="space-y-4">
            {/* 登録情報サマリ */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setShowProfile(true)}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-left hover:bg-rose-100 transition-all">
                <div className="text-xs font-bold text-rose-700 mb-0.5">🩺 健康プロフィール</div>
                <p className="text-xs text-rose-600 truncate">{profileSummary}</p>
                <p className="text-xs text-rose-400 mt-1">タップで編集</p>
              </button>
              <button onClick={()=>setShowStock(true)}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-left hover:bg-blue-100 transition-all">
                <div className="text-xs font-bold text-blue-700 mb-0.5">🧊 食材ストック</div>
                <p className="text-xs text-blue-600 truncate">{stockSummary}</p>
                <p className="text-xs text-blue-400 mt-1">タップで編集</p>
              </button>
            </div>

            <SectionCard icon="🌡️" title="今日の体調" sub="（任意）">
              <div className="flex flex-wrap gap-2 mt-2">
                {CONDITION_TAGS.map(c=>(
                  <Tag key={c} label={c} selected={bodyCond===c}
                    onClick={()=>setBodyCond(p=>p===c?"":c)} color="teal"/>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon="🍴" title="食欲" sub="（任意）">
              <div className="flex flex-wrap gap-2 mt-2">
                {APPETITE_TAGS.map(c=>(
                  <Tag key={c} label={c} selected={appetite===c}
                    onClick={()=>setAppetite(p=>p===c?"":c)} color="teal"/>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon="✨" title="今夜の気分" sub="（任意・複数可）">
              <div className="flex flex-wrap gap-2 mt-2">
                {PREF_TAGS.map(c=>(
                  <Tag key={c} label={c} selected={prefs.includes(c)}
                    onClick={()=>toggle(prefs,setPrefs,c)} color="amber"/>
                ))}
              </div>
            </SectionCard>

            {/* 今日のモード */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
                <span>🎯</span> 今日のモード
                <span className="text-xs text-gray-400 font-normal ml-1">（任意）</span>
              </h2>
              <p className="text-xs text-gray-400 mb-3">特別感、時短、ヘルシーなど、今日のテーマを選ぶとAIがそれに合わせて提案します</p>
              <div className="grid grid-cols-1 gap-2">
                {DINNER_MODES.map(m => (
                  <button key={m.id} onClick={() => setDinnerMode(p => p === m.id ? "" : m.id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      dinnerMode === m.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-100 bg-gray-50 hover:border-teal-200 hover:bg-teal-50"
                    }`}>
                    <span className="text-2xl flex-shrink-0">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${dinnerMode === m.id ? "text-teal-700" : "text-gray-700"}`}>
                        {m.label}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{m.desc}</div>
                    </div>
                    {dinnerMode === m.id && (
                      <span className="text-teal-500 font-bold text-sm flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={()=>setStep(2)}
              className="w-full py-4 rounded-2xl font-bold bg-teal-500 text-white hover:bg-teal-600 shadow-md">
              次へ：今日の食材を確認する →
            </button>
          </div>
        )}

        {/* ══ STEP 2: 今日の食材 ══ */}
        {step===2 && (
          <div className="space-y-4">

            {/* 冷凍・常備品 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-0.5 flex items-center gap-2">
                <span>🧊</span> 冷凍・常備品
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                登録済み {savedFrozen.length}品 ―
                <span className="text-red-400 ml-1">今日切らしているものをタップして除外</span>
              </p>
              {savedFrozen.length === 0 ? (
                <button onClick={()=>setShowStock(true)}
                  className="text-sm text-blue-500 underline">
                  ＋ 冷凍・常備品を登録する
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedFrozen.map(i=>(
                    <Tag key={i} label={frozenOut.includes(i)?`${i} ✕`:i}
                      selected={frozenOut.includes(i)}
                      onClick={()=>toggle(frozenOut,setFrozenOut,i)}
                      color={frozenOut.includes(i)?"red":"slate"}/>
                  ))}
                </div>
              )}
              {frozenOut.length>0 && (
                <p className="text-xs text-red-400 mt-2">
                  ✕ {frozenOut.join("、")} は今日の食材から除外されます
                </p>
              )}
            </div>

            {/* 生鮮品 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-0.5 flex items-center gap-2">
                <span>🥦</span> 今日の生鮮食品
              </h2>
              <p className="text-xs text-gray-400 mb-3">スーパーで買ったもの・今日使いたいものを選択</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {FRESH_OPTIONS.map(i=>(
                  <Tag key={i} label={i} selected={freshSel.includes(i)}
                    onClick={()=>toggle(freshSel,setFreshSel,i)} color="teal"/>
                ))}
              </div>
              {/* 自由記入 */}
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-500 mb-2">候補にない食材は自由記入</p>
                <div className="flex gap-2">
                  <input value={freshInput} onChange={e=>setFreshInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addFreshFree()}
                    placeholder="例：春菊、あさり、豚ロース…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"/>
                  <button onClick={addFreshFree}
                    className="px-4 py-2 rounded-xl bg-teal-100 text-teal-700 font-bold text-sm hover:bg-teal-200">
                    追加
                  </button>
                </div>
                {freshFree && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {freshFree.split("、").map((item,i)=>(
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-full text-xs text-teal-700">
                        {item}
                        <button onClick={()=>{
                          const arr = freshFree.split("、").filter((_,j)=>j!==i);
                          setFreshFree(arr.join("、"));
                        }} className="text-teal-400 hover:text-red-400 ml-0.5">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 調味料サマリ */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold text-amber-700 flex items-center gap-1">
                  🫙 調味料・香辛料（登録済み）
                </div>
                <button onClick={()=>setShowStock(true)}
                  className="text-xs text-amber-600 border border-amber-300 rounded-full px-2 py-0.5 hover:bg-amber-100">
                  編集
                </button>
              </div>
              {savedSeasons.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {savedSeasons.map(i=>(
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{i}</span>
                  ))}
                </div>
              ) : (
                <button onClick={()=>setShowStock(true)} className="text-xs text-amber-500 underline">
                  ＋ 調味料を登録する
                </button>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button onClick={()=>setStep(1)}
                className="flex-1 py-4 rounded-2xl font-bold border border-gray-300 text-gray-600 hover:bg-gray-50">
                ← 戻る
              </button>
              <button onClick={generateMenu} disabled={loading}
                className="flex-grow-[2] py-4 rounded-2xl font-bold bg-teal-500 text-white hover:bg-teal-600 shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                {loading?<><span>献立を考えています</span><Dots/></>:"🍽️ 献立を提案してもらう"}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: 献立＆チャット ══ */}
        {step===3 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">💬 献立チャット</span>
                <span className="text-xs text-gray-400">「魚に変えて」「副菜を追加して」など</span>
              </div>
              <div className="p-3 space-y-0.5"
                style={{minHeight:"100px",maxHeight:"320px",overflowY:"auto"}}>
                {chatHistory.map((msg,i)=><ChatBubble key={i} msg={msg}/>)}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm pl-1 py-1">
                    <span>🤖</span><Dots/>
                  </div>
                )}
                <div ref={chatEnd}/>
              </div>
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
                  placeholder="例：魚を使ったメニューに変えて、副菜をもう1品追加して"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  disabled={chatLoading}/>
                <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 disabled:opacity-40 transition-all">
                  送信
                </button>
              </div>
            </div>

            {menuResult && (
              <MenuCard menu={menuResult} checkedItems={checked}
                onToggleCheck={i=>setChecked(p=>({...p,[i]:!p[i]}))}
                onCopy={copyList}
                onOpenTasks={()=>window.open("https://tasks.google.com","_blank")}
                copied={copied}/>
            )}

            <button onClick={reset}
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
              ← 最初からやり直す
            </button>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showProfile && (
        <ProfileModal init={savedCond} initNote={savedNote}
          onSave={saveProfile} onClose={()=>setShowProfile(false)}/>
      )}
      {showStock && (
        <StockModal initFrozen={savedFrozen} initSeasonings={savedSeasons}
          onSave={saveStock} onClose={()=>setShowStock(false)}/>
      )}
    </div>
  );
}
