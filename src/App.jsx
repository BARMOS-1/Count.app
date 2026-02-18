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

  const GAS_URL = "https://script.google.com/macros/s/AKfycbwUhOhxeRTXh_1cy5qWd-RVH3qwLya_H7ixARMdr_7273yEV4Q0DzF-eqd-5sdccUd7Iw/exec";

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
            <Button modifier="quiet" onClick={() => handleDelete(item.rowIdx)} style={{ color: '#e91e63', padding: '0 8px' }}>
              <Icon icon="md-delete" style={{ fontSize: '22px' }} />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // --- [画面A] 入力ページ ---
// --- [画面A] 入力ページ ---
  const renderInputPage = () => {
    const productivity =
      count && hours && Number(hours) > 0
        ? (Number(count) / Number(hours)).toFixed(1)
        : null;

    const sectionStyle = {
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '1px solid #e5e5e5'
    };

    return (
      <Page>
        {/* タイトルバー */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e5e5',
          fontWeight: 'bold',
          color: '#00629d',
          fontSize: '1rem'
        }}>
          {editRowIdx ? "【編集モード】内容を修正してください" : "実績入力"}
        </div>

        {/* --- メインコンテンツ：ここをFlexboxに変更 --- */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', // 画面が狭いと自動で上下に並ぶ
          gap: '10px', 
          padding: '10px',
          backgroundColor: '#f0f2f5' 
        }}>
          
          {/* 左側：入力フォーム (幅 600px以上あれば横並び、なければ100%) */}
          <div style={{ flex: '1 1 400px', minWidth: '320px' }}>
            <Card style={{
              padding: '25px',
              borderRadius: '18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              margin: '10px'
            }}>
              {/* 作業日 */}
              <div style={sectionStyle}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>作業日</div>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%' }} />
              </div>

              {/* 員数個数 */}
              <div style={sectionStyle}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>員数個数</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} placeholder="例：20"
                    style={{ width: "100%", fontSize: "1.6rem", fontWeight: "bold", padding: "12px", borderRadius: "12px", border: "1px solid #ddd", backgroundColor: "#fafafa" }}
                  />
                  <span style={{ marginLeft: '12px' }}>個</span>
                </div>
              </div>

              {/* 作業時間 */}
              <div style={sectionStyle}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>作業時間</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="例：15分→0.25h"
                    style={{ width: "100%", fontSize: "1.6rem", fontWeight: "bold", padding: "12px", borderRadius: "12px", border: "1px solid #ddd", backgroundColor: "#fafafa" }}
                  />
                  <span style={{ marginLeft: '12px' }}>ｈ</span>
                </div>
              </div>

              {/* 生産性表示 */}
              {productivity && (
                <div style={{ backgroundColor: '#f4f9ff', padding: '14px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #d9eaff' }}>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>1時間あたり</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#00629d' }}>{productivity} 個</div>
                </div>
              )}

              {/* 備考 */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>備考</div>
                <textarea className="textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>

              <Button modifier="large" onClick={handleSubmit} disabled={loading} style={{ backgroundColor: editRowIdx ? '#f0ad4e' : '#00629d', borderRadius: '14px' }}>
                {loading ? <ProgressCircular indeterminate /> : (editRowIdx ? '更新を保存する' : '実績を保存する')}
              </Button>
              {editRowIdx && (
                <Button modifier="large--quiet" onClick={() => { setEditRowIdx(null); setCount(''); setHours(''); setRemarks(''); }} style={{ color: '#777', marginTop: '10px' }}>
                  キャンセル
                </Button>
              )}
            </Card>
          </div>

          {/* 右側：最近の履歴 (幅 300px〜) */}
          <div style={{ flex: '1 1 300px', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              margin: '10px',
              padding: '10px 15px',
              backgroundColor: '#fff',
              borderRadius: '12px 12px 0 0',
              borderBottom: '2px solid #00629d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>最近の履歴 (5件)</span>
              <Button modifier="quiet" onClick={() => setTabIndex(1)} style={{ fontSize: '0.7rem' }}>一覧へ</Button>
            </div>
            
            <div style={{ padding: '0 10px', overflowY: 'auto', maxHeight: '70vh' }}>
              {history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>履歴なし</div>
              ) : (
                history.slice(0, 5).map((item, index) => renderHistoryCard(item, index))
              )}
            </div>
          </div>

        </div>
        <div style={{ height: '70px' }}></div>
      </Page>
    );
  };



  // --- [画面B] 履歴検索ページ ---
  const renderHistoryPage = () => {
    const filteredData = history.filter(item => {
      if (!filterDate) return true;
      const selected = filterDate.split('-').slice(1).join('/'); // YYYY-MM-DD -> MM/DD
      return item.date.startsWith(selected);
    });

    return (
      <Page>
        <div style={{ padding: '15px', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>過去の履歴を検索</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ flex: 1, backgroundColor: '#fff', padding: '5px' }} />
            <Button modifier="outline" onClick={() => setFilterDate('')} style={{ fontSize: '0.8rem' }}>すべて表示</Button>
          </div>
          {filterDate && <div style={{marginTop:'8px', fontSize:'0.8rem', color:'#00629d'}}>{filterDate} の履歴: {filteredData.length}件</div>}
        </div>
        <div style={{ padding: '8px' }}>
          {filteredData.length === 0 ? (
            <div style={{padding: '40px', textAlign: 'center', color: '#999'}}><Icon icon="md-calendar-note" size={40} /><br/>履歴がありません</div>
          ) : (
            filteredData.map((item, index) => renderHistoryCard(item, index))
          )}
        </div>
        <div style={{height: '50px'}}></div>
      </Page>
    );
  };

  // --- ログイン画面 ---
  if (!isLoggedIn) {
    return (
      <Page>
        <div className="login-container">
          <div className="login-card">
            <div className="login-title">員数管理システム</div>
            <div className="logo-placeholder"><Icon icon="md-store" style={{fontSize: '50px', color: '#aaa'}} /></div>
            <input type="password" className="custom-input" placeholder="パスワードを入力" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="login-btn-primary" onClick={handleLogin}>{loading ? "認証中..." : "ログインして開始"}</button>
          </div>
          <div className="footer-text">© 2026 KAYAMIND System </div>
        </div>
      </Page>
    );
  }

  // --- メイン画面（タブバー） ---
  return (
    <Page renderToolbar={() => (
      <Toolbar>
        <div className="left"><Button modifier="quiet" onClick={() => setIsLoggedIn(false)}><Icon icon="md-arrow-left" /></Button></div>
        <div className="center">{baseName}</div>
      </Toolbar>
    )}>
      <Tabbar
        position='bottom'
        index={tabIndex}
        onPreChange={(e) => setTabIndex(e.index)}
        renderTabs={() => [
          { content: renderInputPage(), tab: <Tab label="入力" icon="md-edit" /> },
          { content: renderHistoryPage(), tab: <Tab label="履歴" icon="md-view-list" /> }
        ]}
      />
    </Page>
  );
};

export default App;