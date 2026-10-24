import React, { useState, useEffect } from 'react';
import { 
  Shield, Settings, Radio, Database, Users, 
  Layers, Code, Activity, ArrowLeft, Lock, Unlock, 
  Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Search,
  Upload, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminControlPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<string | null>(null);

  // --- Card A: SMS Gateway State ---
  const [smsKey, setSmsKey] = useState(() => localStorage.getItem('admin_sms_key') || '');
  const [smsConnected, setSmsConnected] = useState(() => localStorage.getItem('admin_sms_connected') === 'true');
  const webhookUrl = 'https://glpdbelcbqrnyuyohhzb.supabase.co/functions/v1/sms-webhook';

  // --- Card B: USSD Receiver Numbers State ---
  const [ussdLines, setUssdLines] = useState(() => {
    const saved = localStorage.getItem('admin_ussd_lines');
    return saved ? JSON.parse(saved) : [
      { id: '1', phone: '+2348030001111', label: 'MTN Gateway', status: 'ACTIVE', primary: true },
      { id: '2', phone: '+2348050002222', label: 'Glo Gateway', status: 'STANDBY', primary: false },
      { id: '3', phone: '+2348020003333', label: 'Airtel Gateway', status: 'LOCKED 24h COOLDOWN', primary: false }
    ];
  });
  const [autoSwitch, setAutoSwitch] = useState(() => localStorage.getItem('admin_ussd_autoswitch') === 'true');

  // --- Card C: VTU Integration State ---
  const [vtuKey, setVtuKey] = useState(() => localStorage.getItem('admin_vtu_key') || '');
  const [minWithdrawal, setMinWithdrawal] = useState(() => Number(localStorage.getItem('admin_min_withdrawal')) || 500);
  const [accountReserve, setAccountReserve] = useState(() => Number(localStorage.getItem('admin_account_reserve')) || 100);

  // --- Card D: User Wallet State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [userBalance, setUserBalance] = useState(1250);
  const [userStatus, setUserStatus] = useState<'Active' | 'Suspended'>('Active');

  // --- Card E: Matchday Scanner & Logo Library State ---
  const [bulkAliasText, setBulkAliasText] = useState('');
  const [aliasLibrary, setAliasLibrary] = useState<{ primaryName: string; aliases: string[] }[]>(() => {
    const saved = localStorage.getItem('admin_alias_library');
    return saved ? JSON.parse(saved) : [
      { primaryName: 'FC Barcelona', aliases: ['barcelona', 'barca', 'fc barcelona'] },
      { primaryName: 'Real Madrid', aliases: ['real madrid', 'rmfc', 'merengues'] },
      { primaryName: 'Gil Vicente FC', aliases: ['barcelos', 'gil vicente', 'gvf'] },
      { primaryName: 'Tottenham Hotspur', aliases: ['tottenham', 'spurs', 'tottenham hotspur', 'tetienham'] }
    ];
  });
  const [savedLogos, setSavedLogos] = useState<{ primaryName: string; crestUrl: string }[]>(() => {
    const saved = localStorage.getItem('admin_saved_logos');
    return saved ? JSON.parse(saved) : [
      { primaryName: 'FC Barcelona', crestUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=100&auto=format&fit=crop&q=60' }
    ];
  });
  const [uploadTeamName, setUploadTeamName] = useState('');
  const [uploadCrestUrl, setUploadCrestUrl] = useState('');
  const [selectedCrestFileName, setSelectedCrestFileName] = useState('');
  const crestFileInputRef = React.useRef<HTMLInputElement>(null);
  const [kickoffLockoutTime, setKickoffLockoutTime] = useState(() => localStorage.getItem('admin_kickoff_lock') || '18:00');

  // --- Card F: Game Codes Hub State ---
  const [gameCodes, setGameCodes] = useState(() => {
    const saved = localStorage.getItem('admin_game_codes');
    return saved ? JSON.parse(saved) : [
      { id: '1', code: 'MB-2026-X1', title: 'Premier League Derby', kickoff: '2026-10-25T18:00', status: 'ACTIVE' },
      { id: '2', code: 'MB-2026-X2', title: 'El Clasico Showdown', kickoff: '2026-10-26T20:00', status: 'ACTIVE' }
    ];
  });

  // --- Card G: System Transaction Ledger State ---
  const [ledgerLogs] = useState([
    { id: '1', time: '11:15 AM', phone: '+2348123456789', action: 'DEPOSIT', amount: '+500 MB', status: 'SUCCESS' },
    { id: '2', time: '10:42 AM', phone: '+2348031112222', action: 'BET_PLACED', amount: '-150 MB', status: 'SUCCESS' },
    { id: '3', time: '09:05 AM', phone: '+2348059990000', action: 'VTU_WITHDRAWAL', amount: '-500 MB', status: 'PENDING' },
    { id: '4', time: '08:30 AM', phone: '+2348023334444', action: 'KIT_UNLOCKED', amount: '-50 MB', status: 'SUCCESS' }
  ]);

  // Sync to local storage
  useEffect(() => { localStorage.setItem('admin_ussd_lines', JSON.stringify(ussdLines)); }, [ussdLines]);
  useEffect(() => { localStorage.setItem('admin_alias_library', JSON.stringify(aliasLibrary)); }, [aliasLibrary]);
  useEffect(() => { localStorage.setItem('admin_saved_logos', JSON.stringify(savedLogos)); }, [savedLogos]);
  useEffect(() => { localStorage.setItem('admin_game_codes', JSON.stringify(gameCodes)); }, [gameCodes]);

  // Handler: SMS Save
  const handleSaveSmsKey = () => {
    localStorage.setItem('admin_sms_key', smsKey);
    const isConn = smsKey.trim().length > 8;
    setSmsConnected(isConn);
    localStorage.setItem('admin_sms_connected', String(isConn));
    toast.success(isConn ? 'SMS Gateway Connected!' : 'SMS Key saved (Disconnected)');
  };

  // Handler: Bulk Alias Parse with Safeguards & AI Lookup Simulation
  const handleParseAliases = () => {
    if (!bulkAliasText.trim()) return;

    const gibberishRegex = /^(?=.*[0-9]{5,})|^(?=[a-z0-9]{8,})(?![a-z\s\/]{3,})/i;
    if (gibberishRegex.test(bulkAliasText) || bulkAliasText.length < 3) {
      toast.error('Invalid Entry: Input does not match any recognized football club or city structure');
      return;
    }

    const parts = bulkAliasText.split('/').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    const primaryName = parts[0];
    const aliases = parts.map(p => p.toLowerCase());

    let resolvedPrimary = primaryName;
    if (primaryName.toLowerCase() === 'barcelos') {
      resolvedPrimary = 'Gil Vicente FC';
      toast.info("AI Sync Complete: Resolved 'Barcelos' to 'Gil Vicente FC' and updated library.");
    }

    const existingIdx = aliasLibrary.findIndex(
      item => item.primaryName.toLowerCase() === resolvedPrimary.toLowerCase()
    );

    if (existingIdx >= 0) {
      const updated = [...aliasLibrary];
      const mergedAliases = Array.from(new Set([...updated[existingIdx].aliases, ...aliases]));
      updated[existingIdx].aliases = mergedAliases;
      setAliasLibrary(updated);
    } else {
      setAliasLibrary([...aliasLibrary, { primaryName: resolvedPrimary, aliases }]);
    }

    setBulkAliasText('');
    toast.success(`Successfully parsed team alias entry for ${resolvedPrimary}!`);
  };

  // Handler: Read a phone/gallery image and compress it before storing locally.
  const handleCrestFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Choose an image smaller than 10 MB.');
      return;
    }
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image could not be read'));
        reader.onerror = () => reject(new Error('Image could not be read'));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image could not be opened'));
        img.src = source;
      });
      const canvas = document.createElement('canvas');
      const maxDimension = 256;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing is unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/webp', 0.82);
      setUploadCrestUrl(compressed);
      setSelectedCrestFileName(file.name);
      toast.success('Image selected. Enter the team name, then save the crest.');
    } catch {
      toast.error('Could not read that image. Try another image.');
    }
  };

  // Handler: Logo Upload
  const handleUploadLogo = () => {
    if (!uploadTeamName.trim() || !uploadCrestUrl.trim()) {
      toast.error('Please enter both team name and logo image URL');
      return;
    }

    const matchedGroup = aliasLibrary.find(group => 
      group.primaryName.toLowerCase() === uploadTeamName.toLowerCase() ||
      group.aliases.includes(uploadTeamName.toLowerCase())
    );

    const targetPrimary = matchedGroup ? matchedGroup.primaryName : uploadTeamName.trim();

    if (!matchedGroup) {
      setAliasLibrary(current => [...current, { primaryName: targetPrimary, aliases: [targetPrimary.toLowerCase()] }]);
    }

    const filtered = savedLogos.filter(l => l.primaryName.toLowerCase() !== targetPrimary.toLowerCase());
    setSavedLogos([...filtered, { primaryName: targetPrimary, crestUrl: uploadCrestUrl }]);

    setUploadTeamName('');
    setUploadCrestUrl('');
    setSelectedCrestFileName('');
    toast.success(`Logo saved for ${targetPrimary} on this device.`);
  };
      const renderSubView = () => {
    switch (activeView) {
      case 'sms':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400">SMS Gateway API Configuration</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Connection Status:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${smsConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                  {smsConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">SMS Gateway API Key</label>
                <input 
                  type="password" 
                  value={smsKey} 
                  onChange={(e) => setSmsKey(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  placeholder="Paste SMS Provider API Key..."
                />
              </div>
              <button 
                onClick={handleSaveSmsKey}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Save Key
              </button>
              <div className="pt-3 border-t border-slate-800">
                <label className="text-[11px] text-slate-400 block mb-1">Supabase Webhook URL (Read-only)</label>
                <div className="flex space-x-2">
                  <input type="text" readOnly value={webhookUrl} className="w-full bg-slate-900 border border-slate-800 text-[11px] p-2 rounded text-slate-400 select-all font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Webhook link copied!'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded text-xs font-medium">Copy Link</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ussd':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-amber-400">USSD Receivers & Failover</h2>
              <button 
                onClick={() => {
                  const num = prompt('Enter new USSD receiver phone number:');
                  if (num) setUssdLines([...ussdLines, { id: Date.now().toString(), phone: num, label: 'Custom Line', status: 'STANDBY', primary: false }]);
                }} 
                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add USSD Number</span>
              </button>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-300">Auto-Switch on Limit Alert</span>
              <input 
                type="checkbox" 
                checked={autoSwitch} 
                onChange={(e) => {
                  setAutoSwitch(e.target.checked);
                  localStorage.setItem('admin_ussd_autoswitch', String(e.target.checked));
                  toast.success(`Auto-Switch ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                }}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              {ussdLines.map((line: any) => (
                <div key={line.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="primaryUssd" 
                        checked={line.primary} 
                        onChange={() => {
                          setUssdLines(ussdLines.map((l: any) => ({ ...l, primary: l.id === line.id, status: l.id === line.id ? 'ACTIVE' : l.status })));
                          toast.success(`${line.phone} set as Primary Active line.`);
                        }}
                        className="accent-amber-500 cursor-pointer" 
                      />
                      <input 
                        type="text" 
                        value={line.phone} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setUssdLines(ussdLines.map((l: any) => l.id === line.id ? { ...l, phone: val } : l));
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300"
                      />
                      <span className="text-[11px] text-slate-400">({line.label})</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      line.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' :
                      line.status === 'STANDBY' ? 'bg-blue-950 text-blue-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {line.status}
                    </span>
                  </div>

                  {line.status.includes('LOCKED') && (
                    <button 
                      onClick={() => {
                        setUssdLines(ussdLines.map((l: any) => l.id === line.id ? { ...l, status: 'STANDBY' } : l));
                        toast.success(`Unlocked ${line.phone} cooldown lock.`);
                      }}
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 px-3 py-1 rounded text-xs flex items-center space-x-1"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Force Reset / Unlock</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'vtu':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400">VTU Integration & Withdrawal Rules</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">VTU API Key</label>
                <input 
                  type="password" 
                  value={vtuKey} 
                  onChange={(e) => setVtuKey(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs" 
                  placeholder="Enter VTU provider key..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min Withdrawal Threshold (MB)</label>
                  <input 
                    type="number" 
                    value={minWithdrawal} 
                    onChange={(e) => setMinWithdrawal(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Account Reserve Rule (MB)</label>
                  <input 
                    type="number" 
                    value={accountReserve} 
                    onChange={(e) => setAccountReserve(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs" 
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.setItem('admin_vtu_key', vtuKey);
                  localStorage.setItem('admin_min_withdrawal', String(minWithdrawal));
                  localStorage.setItem('admin_account_reserve', String(accountReserve));
                  toast.success('VTU Rules & Thresholds Saved!');
                }} 
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold mt-2 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400">User Wallet & Accounts Manager</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by phone number or profile ID..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200" 
                />
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-300">+2348123456789</span>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">{userBalance} MB Balance</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${userStatus === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                    {userStatus}
                  </span>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => { setUserBalance(b => b + 100); toast.success('Credited +100 MB to user'); }} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    + Credit MB
                  </button>
                  <button 
                    onClick={() => { setUserBalance(b => Math.max(0, b - 100)); toast.success('Deducted -100 MB from user'); }} 
                    className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    - Deduct MB
                  </button>
                  <button 
                    onClick={() => {
                      const next = userStatus === 'Active' ? 'Suspended' : 'Active';
                      setUserStatus(next);
                      toast.info(`Account status changed to ${next}`);
                    }} 
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        case 'scanner':
        return (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-amber-400">Matchday Scanner & Team Logo Library</h2>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs text-slate-300 font-semibold block">Bulk Team Import (Slash-separated)</label>
              <textarea 
                rows={3} 
                value={bulkAliasText}
                onChange={(e) => setBulkAliasText(e.target.value)}
                placeholder="Example: Tottenham Hotspur / Tottenham / Spurs / TETIENHAM" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200" 
              />
              <button 
                onClick={handleParseAliases} 
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Parse & Save Library
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-300">Connected Logo Upload Form</h3>
              <input
                ref={crestFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCrestFileChange}
                className="hidden"
              />
              <input
                type="text"
                value={uploadTeamName}
                onChange={(e) => setUploadTeamName(e.target.value)}
                placeholder="Official team name or alias (e.g., Spurs)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => crestFileInputRef.current?.click()}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Choose Image from Phone
                </button>
                <span className="self-center text-[11px] text-slate-400">
                  {selectedCrestFileName || 'PNG, JPG, WEBP or another image'}
                </span>
              </div>
              <input
                type="url"
                value={uploadCrestUrl.startsWith('data:image/') ? '' : uploadCrestUrl}
                onChange={(e) => { setUploadCrestUrl(e.target.value); setSelectedCrestFileName(''); }}
                placeholder="Or paste a public image URL"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
              />
              {uploadCrestUrl && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2">
                  <img src={uploadCrestUrl} alt="Selected team crest preview" className="h-14 w-14 rounded object-contain bg-slate-950 p-1" />
                  <div className="text-[11px] text-slate-300">Crest preview</div>
                  <button type="button" onClick={() => { setUploadCrestUrl(''); setSelectedCrestFileName(''); }} className="ml-auto text-xs text-rose-400">Remove</button>
                </div>
              )}
              <button 
                onClick={handleUploadLogo} 
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Upload Crest Logo
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300">Saved Logo & Alias Grid</h3>
              <div className="space-y-2">
                {aliasLibrary.map((item, idx) => {
                  const logoObj = savedLogos.find(l => l.primaryName.toLowerCase() === item.primaryName.toLowerCase());
                  return (
                    <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {logoObj ? (
                          <img src={logoObj.crestUrl} alt={item.primaryName} className="w-8 h-8 rounded object-cover border border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">NO LOGO</div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-amber-300">{item.primaryName}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.aliases.map((a, i) => (
                              <span key={i} className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAliasLibrary(aliasLibrary.filter((_, i) => i !== idx))} 
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs text-slate-300 block font-semibold">Match Kickoff Lockout Clock</label>
              <input 
                type="time" 
                value={kickoffLockoutTime} 
                onChange={(e) => {
                  setKickoffLockoutTime(e.target.value);
                  localStorage.setItem('admin_kickoff_lock', e.target.value);
                  toast.success(`Kickoff auto-freeze time updated to ${e.target.value}`);
                }} 
                className="bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold rounded p-2"
              />
            </div>
          </div>
        );

      case 'codes':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400">Official Game Codes Hub Manager</h2>
            <div className="space-y-3">
              {gameCodes.map((item: any) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{item.code}</span>
                    <select 
                      value={item.status} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setGameCodes(gameCodes.map((g: any) => g.id === item.id ? { ...g, status: val } : g));
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs text-amber-300 rounded px-2 py-1 font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="HIDDEN">HIDDEN</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Matchday Name / Title</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setGameCodes(gameCodes.map((g: any) => g.id === item.id ? { ...g, title: val } : g));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200" 
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Kickoff Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={item.kickoff} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setGameCodes(gameCodes.map((g: any) => g.id === item.id ? { ...g, kickoff: val } : g));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-amber-300 font-mono" 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => toast.success(`Game Code settings saved for ${item.code}`)} 
                    className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    Save Code Settings
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ledger':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400">System Transaction Ledger</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">User Phone</th>
                    <th className="pb-2">Action Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {ledgerLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 font-mono text-slate-400">{log.time}</td>
                      <td className="py-2 font-mono text-amber-300">{log.phone}</td>
                      <td className="py-2 font-semibold">{log.action}</td>
                      <td className="py-2 font-bold text-emerald-400">{log.amount}</td>
                      <td className="py-2">
                        <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const menuCards = [
    { id: 'sms', label: 'SMS Gateway API', icon: Settings },
    { id: 'ussd', label: 'USSD Receiver Numbers & Failover Manager', icon: Radio },
    { id: 'vtu', label: 'VTU Integration & Withdrawal Rules', icon: Database },
    { id: 'wallet', label: 'User Wallet & Accounts Manager', icon: Users },
    { id: 'scanner', label: 'Matchday Scanner & Team Logo Library', icon: Layers },
    { id: 'codes', label: 'Official Game Codes Hub Manager', icon: Code },
    { id: 'ledger', label: 'System Transaction Ledger', icon: Activity }
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-5 pb-28 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-amber-400" />
          <div>
            <h1 className="text-base font-bold text-slate-100">Admin Control Panel</h1>
            <p className="text-[11px] text-slate-400">Account & Activity Governance</p>
          </div>
        </div>
        {activeView && (
          <button 
            onClick={() => setActiveView(null)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {!activeView ? (
        <div className="space-y-2.5">
          {menuCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div 
                key={card.id}
                onClick={() => setActiveView(card.id)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition group"
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-semibold text-slate-200">{card.label}</span>
                </div>
                <span className="text-slate-500 text-xs group-hover:text-amber-300 font-bold">&gt;</span>
              </div>
            );
          })}
        </div>
      ) : (
        renderSubView()
      )}
    </div>
  );
};
