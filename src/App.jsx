import React, { useState, useEffect } from 'react';
import { Page, Toolbar, List, ListItem, Input, Button, Icon, ProgressCircular, Card, Tabbar, Tab } from 'react-onsenui';
import './App.css';

const App = () => {
  // --- 共通ステート管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [baseName, setBaseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const [tabIndex, setTabIndex] = useState(0); // タブ管理用
  const [password, setPassword] = useState('');

  // --- 入力・検索用ステート ---
  const [editRowIdx, setEditRowIdx] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [count, setCount] = useState('');
  const [hours, setHours] = useState('');
  const [remarks, setRemarks] = useState('');
  const [filterDate, setFilterDate] = useState(''); // カレンダー検索用

  const GAS_URL = "https://script.google.com/macros/s/AKfycbxBeIMg0D6MUCv_TqBQCsSnQJaGwVSmhefk9W6UJilIjZkfT0E4OououXSU6yyhFnPLVw/exec";
  
// --- 軽量カスタムカレンダー ---
const historyDates = history.map(item => item.date);
const SimpleCalendar = ({ selectedDate, onChange, historyDates }) => {

  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < startWeekDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  const formatDate = (dateObj) =>
    dateObj.toISOString().split('T')[0];

  const todayStr = new Date().toISOString().split('T')[0];

 return (
        <div
            style={{
                background: "#fff",
                padding: "12px",
                borderRadius: "12px",
                width: "100%",        // 幅を100%に固定
                boxSizing: "border-box", // パディングを幅に含める（重要！）
                margin: "10px 0",     // 上下の余白のみ
                border: "1px solid #eee"
            }}
        >

      {/* 月ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>◀</button>
        <strong>{year}年 {month + 1}月</strong>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>▶</button>
      </div>

      {/* 曜日 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "0.8rem" }}>
        {["日","月","火","水","木","金","土"].map(d => (
          <div key={d} style={{ fontWeight: "bold" }}>{d}</div>
        ))}
      </div>

      {/* 日付 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginTop: "5px" }}>
        {days.map((day, index) => {

          if (!day) return <div key={index}></div>;

          const dateStr = formatDate(day);
          const hasData = historyDates.includes(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={index}
              onClick={() => onChange(dateStr)}
              style={{
                padding: "6px",
                borderRadius: "50%",
                textAlign: "center",
                cursor: "pointer",
                // ↓ 【修正箇所】isSelected を一番最初に判定します
                background: isSelected ? "#FA6673" : (hasData ? "#3498db" : "transparent"),
                // 文字色も選択中またはデータありなら白にする
                color: (isSelected || hasData) ? "#fff" : "#000",
                // 今日は枠線をつける
                border: isToday ? "2px solid #3498db" : "1px solid #eee",
                fontWeight: isSelected ? "bold" : "normal"
              }}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};



  // --- 1. 履歴取得 ---
  const fetchHistory = async () => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ password, mode: "history" })
      });
      const data = await response.json();
      if (data.result !== "error") {
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("履歴の取得に失敗しました");
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchHistory();
  }, [isLoggedIn]);

  // --- 2. ログイン ---
  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ password, mode: "login" }) 
      });
      const data = await response.json();
      if (data.result === "success") {
        setBaseName(data.base);
        setIsLoggedIn(true);
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("通信エラー");
    }
    setLoading(false);
  };

  // --- 3. 保存（新規・更新 共通） ---
  const handleSubmit = async () => {
    if (!count || !hours) return alert("項目を入力してください");
    const mode = editRowIdx ? "update" : "submit";
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          password, mode, rowIdx: editRowIdx,
          date, count, hours, remarks 
        })
      });
      const data = await response.json();

      if (data.result === "success") {
        alert(editRowIdx ? "更新完了！" : "保存完了！");
        setCount(''); setHours(''); setRemarks(''); setEditRowIdx(null);
        fetchHistory(); 
      } else {
        alert("失敗: " + data.message);
      }
    } catch (e) { alert("通信エラー"); }
    setLoading(false);
  };

  // --- 4. 編集開始 ---
    const handleEdit = (item) => {
    setCount(item.count);
    setHours(item.hours);
    setRemarks(item.remarks);
    setDate(item.date); // GASから "yyyy-MM-dd" で届くのでそのままカレンダーに反映される
    setEditRowIdx(item.rowIdx);
    setTabIndex(0); // 入力タブへ切り替え
    window.scrollTo({ top: 0, behavior: 'smooth' });
    };

  // --- 5. 削除 ---
  const handleDelete = async (rowIdx) => {
    if (!window.confirm("この履歴を完全に削除しますか？")) return;
    setEditRowIdx(null);
    setCount(''); setHours(''); setRemarks('');
    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ password, mode: "delete", rowIdx })
      });
      const data = await response.json();
      if (data.result === "success") {
        alert("削除しました");
        fetchHistory();
      }
    } catch (e) { alert("削除失敗"); }
    setLoading(false);
  };

  // --- 共通カードコンポーネント ---
  const renderHistoryCard = (item, index) => {
    const isEditing = editRowIdx === item.rowIdx;
    return (
      <Card 
        key={index} 
        style={{ 
          margin: '8px 0', padding: '12px', borderRadius: '8px', transition: 'all 0.3s ease',
          boxShadow: isEditing ? '0 4px 12px rgba(233, 30, 99, 0.2)' : '0 2px 5px rgba(0,0,0,0.1)',
          backgroundColor: isEditing ? '#fff5f5' : '#ffffff',
          border: isEditing ? '2px solid #e91e63' : '1px solid transparent'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: isEditing ? '#e91e63' : '#888', marginBottom: '4px', fontWeight: isEditing ? 'bold' : 'normal' }}>
              <Icon icon="md-calendar-note" /> {item.date} {isEditing && " (編集選択中)"}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                 {item.count}カゴ
              </span>
              <span style={{ fontSize: '0.9rem', color: '#00629d', backgroundColor: '#eef6fb', padding: '2px 8px', borderRadius: '12px' }}>
                {item.hours}h
              </span>
            </div>
            {item.remarks && (
              <div style={{ fontSize: '0.85rem', color: '#555', backgroundColor: isEditing ? '#ffebeb' : '#f1f1f1', padding: '6px 10px', borderRadius: '4px', borderLeft: isEditing ? '3px solid #e91e63' : '3px solid #ccc' }}>
                {item.remarks}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <Button modifier="quiet" onClick={() => handleEdit(item)} style={{ color: isEditing ? '#ccc' : '#f0ad4e', padding: '0 8px' }} disabled={isEditing}>
              <Icon icon="md-edit" style={{ fontSize: '22px' }} />
            </Button>
            <Button modifier="quiet" onClick={() => handleDelete(item.rowIdx)} style={{ color: '#737373', padding: '0 8px' }}>
              <Icon icon="md-delete" style={{ fontSize: '22px' }} />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

// --- [画面A] 入力ページ ---
const renderInputPage = () => {


  const productivity =
    count && hours && Number(hours) > 0
      ? (Number(count) / Number(hours)).toFixed(1)
      : null;

  return (
    <Page>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        backgroundColor: '#3e4e5e',
        overflowX: 'hidden'
      }}>
        
        {/* タイトルバー */}
        <div style={{ padding: '12px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', fontWeight: 'bold', color: '#00629d', fontSize: '0.95rem' }}>
          {editRowIdx ? "【編集モード】内容を修正してください" : "実績入力"}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '10px', gap: '15px', justifyContent: 'center', alignItems: 'flex-start' }}>
          
          {/* 左側：入力フォーム */}
          <div style={{ flex: '1 1 400px', maxWidth: '450px' }}>
            <Card style={{ padding: '18px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
              
              {/* 作業日 */}
                <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>作業日</div>

                <SimpleCalendar
                    selectedDate={date}
                    onChange={(newDate) => setDate(newDate)}
                    historyDates={historyDates}
                />
                </div>

              {/* 員数個数 */}
              <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>員数個数</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Input 
                    type="number" 
                    value={count} 
                    // 入力した瞬間に状態を更新
                    onChange={(e) => setCount(e.target.value)}
                    // スマホのキーボード確定を待たずに反応させるため、onInputも併用するとより確実です
                    onInput={(e) => setCount(e.target.value)}
                    placeholder="例:20"
                    style={{ width: "100%", fontSize: "1.4rem", fontWeight: "bold", padding: "8px", borderRadius: "10px", border: "1px solid #ddd" }}
                  />
                  <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>カゴ</span>
                </div>
              </div>

              {/* 作業時間 */}
              <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>作業時間</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Input 
                    type="number" 
                    value={hours} 
                    step="0.01" // 小数入力をスムーズにする
                    onChange={(e) => setHours(e.target.value)}
                    onInput={(e) => setHours(e.target.value)} // リアルタイム反映
                    placeholder="例:15分→0.25ｈ"
                    style={{ width: "100%", fontSize: "1.4rem", fontWeight: "bold", padding: "8px", borderRadius: "10px", border: "1px solid #ddd" }}
                  />
                  <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>ｈ</span>
                </div>
              </div>

              {/* 生産性表示（ここが入力中に動くようになります） */}
              <div style={{ 
                backgroundColor: productivity ? '#f4f9ff' : '#fafafa', 
                padding: '12px', 
                borderRadius: '10px', 
                marginBottom: '10px', 
                textAlign: 'center', 
                border: productivity ? '1px solid #d9eaff' : '1px solid #eee',
                transition: 'all 0.2s ease' // 変化を滑らかに
              }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>1時間あたり</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3498db' }}>
                  {productivity ? `${productivity} 個` : '--'}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <textarea className="textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="備考（空欄可）"
                  style={{ width: '100%', height: '45px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button modifier="large" onClick={handleSubmit} disabled={loading} 
                  style={{ backgroundColor: editRowIdx ? '#f0ad4e' : '#3498db', borderRadius: '12px', height: '48px', fontWeight: 'bold' }}>
                  {loading ? <ProgressCircular indeterminate /> : (editRowIdx ? '更新を保存する' : '実績を保存する')}
                </Button>
                {editRowIdx && (
                  <Button modifier="large--quiet" onClick={() => { setEditRowIdx(null); setCount(''); setHours(''); setRemarks(''); }} style={{ color: '#777', fontSize: '0.85rem' }}>
                    キャンセル
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* 右側：最近の履歴 */}
          <div style={{ flex: '1 1 350px', maxWidth: '450px' }}>
            <div style={{ padding: '10px 15px', backgroundColor: '#fff', borderRadius: '12px 12px 0 0', borderBottom: '2px solid #3498db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>最近の履歴 (5件)</span>
              <Button modifier="quiet" onClick={() => setTabIndex(1)} style={{ fontSize: '0.7rem' }}>すべて見る</Button>
            </div>
            <div style={{ backgroundColor: 'transparent' }}>
              {history.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ccc', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0 0 12px 12px' }}>履歴なし</div>
              ) : (
                history.slice(0, 5).map((item, index) => renderHistoryCard(item, index))
              )}
            </div>
          </div>

        </div>
        <div style={{ height: '50px' }}></div>
      </div>
    </Page>
  );
};



  // --- [画面B] 履歴検索ページ ---
const renderHistoryPage = () => {
  const filteredData = history.filter(item => {
    if (!filterDate) return true;

    try {
      // 1. カレンダー入力値 (YYYY-MM-DD) を日付オブジェクトに変換
      const searchDate = new Date(filterDate);
      
      // 2. 履歴データ (item.date) を日付オブジェクトに変換
      // "02/18" だけだと年が補完されない場合があるため、無理やり今年を付与して判定
      const itemDateStr = item.date.includes('/') ? item.date : item.date; 
      const itemDate = new Date(itemDateStr);

      // どちらかが無効な日付ならパス
      if (isNaN(searchDate) || isNaN(itemDate)) {
        // 文字列として部分一致を試みる（最終手段）
        const normalizedFilter = filterDate.replace(/-/g, '/');
        return item.date.includes(normalizedFilter) || item.date.includes(normalizedFilter.substring(5));
      }

      // 3. 年・月・日がすべて一致するか比較
      return (
        searchDate.getFullYear() === itemDate.getFullYear() &&
        searchDate.getMonth() === itemDate.getMonth() &&
        searchDate.getDate() === itemDate.getDate()
      );
    } catch (e) {
      return true;
    }
  });

  return (
    <Page>
      {/* 検索ヘッダーエリア */}
      <div style={{ backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '15px', width: '100%', maxWidth: '450px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>過去の履歴を検索</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <SimpleCalendar
                    selectedDate={filterDate || date}
                    onChange={(newDate) => setFilterDate(newDate)}
                    historyDates={historyDates}
                />

                <Button
                    modifier="outline"
                    onClick={() => setFilterDate('')}
                    style={{ fontSize: '0.8rem' }}
                >
                    すべて表示
                </Button>
                </div>
          {filterDate && (
            <div style={{marginTop:'8px', fontSize:'0.8rem', color:'#3498db', fontWeight: 'bold'}}>
               表示中: {filterDate.replace(/-/g, '/')} （{filteredData.length}件）
            </div>
          )}
        </div>
      </div>

      {/* リスト表示部分 */}
      <div style={{ 
        backgroundColor: '#3e4e5e', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px'
      }}>
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {filteredData.length === 0 ? (
            <div style={{padding: '60px 40px', textAlign: 'center', color: '#fff', opacity: 0.6}}>
              <Icon icon="md-calendar-note" size={50} style={{marginBottom:'10px'}} /><br/>
              その日の履歴は見つかりませんでした
            </div>
          ) : (
            filteredData.map((item, index) => renderHistoryCard(item, index))
          )}
        </div>
        <div style={{ height: '100px' }}></div>
      </div>
    </Page>
  );
};

// --- ログイン画面 ---
if (!isLoggedIn) {
  return (
    <Page>
      <div className="login-container">
        {/* メインのカード */}
        <div className="login-card">
          {/* 上部の青いバー */}
          <div className="login-card-header"></div>
          
          <div className="login-card-body">
            <div className="login-title">員数管理システム</div>
            
            {/* ロゴエリア */}
            <div className="logo-area">
              <img 
                src="/logo.png" 
                alt="KAYAMIND SYSTEM" 
                style={{ width: '180px', height: 'auto', display: 'block', margin: '0 auto' }} 
              />
            </div>

            {/* 上側の罫線 */}
            <hr className="login-divider" />

            <div className="input-label">パスワードを入力</div>
            <input 
              type="password" 
              className="custom-input" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            
            <button className="login-btn-primary" onClick={handleLogin}>
              {loading ? "認証中..." : "ログインして開始"}
            </button>

            {/* 下側の罫線 */}
            <hr className="login-divider" style={{ marginTop: '30px' }} />
          </div>
        </div>

        {/* コピーライト */}
        <div className="footer-text">© 2026 KAYAMIND System </div>
      </div>
    </Page>
  );
}

// --- メイン画面（タブバー） ---
return (
  <Page renderToolbar={() => (
    <Toolbar>
      {/* 左側：矢印ボタンだけにする */}
      <div className="left">
        <Button modifier="quiet" onClick={() => setIsLoggedIn(false)}>
          <Icon icon="md-arrow-left" />
        </Button>
      </div>
      
      {/* 中央：拠点名。スタイルはここだけで指定 */}
      <div className="center" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
        {baseName}
      </div>

      {/* 右側：空（バランスのため） */}
      <div className="right"></div>
    </Toolbar>
  )}>
    <Tabbar
      position='bottom'
      index={tabIndex}
      onPreChange={(e) => setTabIndex(e.index)}
      renderTabs={() => [
        { content: renderInputPage(), tab: <Tab key="tab1" label="入力" icon="md-edit" /> },
        { content: renderHistoryPage(), tab: <Tab key="tab2" label="履歴" icon="md-view-list" /> }
      ]}
    />
  </Page>
);
};

export default App;