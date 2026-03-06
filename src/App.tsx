import React, { useState, useRef } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface StickerItem {
  code: string;
  name: string;
  price: number;
  promoInput: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'import' | 'config' | 'edit'>('import');
  const [items, setItems] = useState<StickerItem[]>([]);
  const [pasteData, setPasteData] = useState('');
  const [filterCodes, setFilterCodes] = useState('');
  const [globalPromoName, setGlobalPromoName] = useState('SIÊU SALE GIÁ SỐC');
  const [globalDate, setGlobalDate] = useState('');

  const formatMoney = (amount: number | string) => {
    if (!amount || isNaN(Number(amount))) return amount;
    return new Intl.NumberFormat('vi-VN').format(Number(amount)) + 'đ';
  };

  const cleanNumber = (val: string | number) => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/\D/g, '')) || 0;
  };

  const processPasteData = () => {
    const rawText = pasteData.trim();
    if (!rawText) {
      alert("Vui lòng dán dữ liệu tổng vào ô trống!");
      return;
    }

    const lines = rawText.split('\n');
    const parsedItems: StickerItem[] = [];

    lines.forEach(line => {
      const cols = line.split('\t');
      if (cols.length >= 1) {
        const code = (cols[0] || '').trim().toUpperCase();
        const name = (cols[1] || '').trim();
        const price = (cols[2] || '').trim();
        const promo = (cols[3] || '').trim();

        if (code || name) {
          parsedItems.push({
            code: code || 'SKU',
            name: name || 'Sản phẩm mới',
            price: cleanNumber(price),
            promoInput: promo
          });
        }
      }
    });

    let finalItems = parsedItems;

    // Filter logic
    const filterText = filterCodes.trim();
    if (filterText) {
      // Split by newline or comma, and remove empty strings
      const codesToPrint = filterText
        .split(/[\n,]+/)
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length > 0);

      if (codesToPrint.length > 0) {
        finalItems = [];
        const itemMap = new Map<string, StickerItem>();
        
        // Build a map of the master data (keep the first occurrence of each SKU)
        parsedItems.forEach(item => {
          if (!itemMap.has(item.code)) {
            itemMap.set(item.code, item);
          }
        });

        // Match requested codes with the master data
        // This also allows printing multiple copies if a code is pasted multiple times
        codesToPrint.forEach(code => {
          if (itemMap.has(code)) {
            finalItems.push({ ...itemMap.get(code)! });
          }
        });
      }
    }

    if (finalItems.length > 0) {
      setItems(finalItems);
      setActiveTab('edit');
    } else {
      alert("Không tìm thấy sản phẩm nào khớp với danh sách mã cần in!");
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemField = (index: number, field: keyof StickerItem, value: string) => {
    const newItems = [...items];
    if (field === 'price') {
      newItems[index][field] = cleanNumber(value);
    } else {
      newItems[index][field] = value as never;
    }
    setItems(newItems);
  };

  const triggerPrint = () => {
    if (items.length === 0) {
      alert("Hãy nhập dữ liệu trước khi in!");
      return;
    }
    
    // In an iframe environment (like AI Studio preview), window.print() might be blocked or not work as expected.
    // We can try to open a new window with the print content if window.print() fails, or just call it directly.
    try {
      window.print(); 
    } catch (e) {
      console.error("Lỗi khi gọi lệnh in:", e);
      alert("Không thể mở hộp thoại in. Vui lòng thử lại hoặc sử dụng tổ hợp phím Ctrl + P.");
    }
  };

  // Group items into pages (6 items per page)
  const pages = [];
  for (let i = 0; i < items.length; i += 6) {
    pages.push(items.slice(i, i + 6));
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible print:bg-white">
      <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Printer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-lg leading-tight">StickerPro</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hệ thống in nhãn chuẩn A4</p>
          </div>
        </div>
        <div className="flex items-center gap-3 no-print">
          <span className="text-[11px] font-bold text-slate-400">Trạng thái máy in:</span>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Sẵn sàng</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <aside className="no-print w-[480px] bg-white border-r border-slate-200 flex flex-col shrink-0 relative shadow-2xl z-40">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
              onClick={() => setActiveTab('import')} 
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'import' ? 'text-rose-600 border-rose-600' : 'border-transparent text-slate-400'}`}
            >
              1. Nhập từ Excel
            </button>
            <button 
              onClick={() => setActiveTab('config')} 
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'config' ? 'text-rose-600 border-rose-600' : 'border-transparent text-slate-400'}`}
            >
              2. Thiết lập
            </button>
            <button 
              onClick={() => setActiveTab('edit')} 
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'edit' ? 'text-rose-600 border-rose-600' : 'border-transparent text-slate-400'}`}
            >
              3. Danh sách
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'import' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                  <h4 className="text-[11px] font-black text-blue-700 uppercase mb-1">Bước 1: Dán dữ liệu tổng</h4>
                  <ol className="text-[11px] text-blue-600 space-y-1 list-decimal ml-4 font-medium">
                    <li>Bôi đen 4 cột trong Excel: <b>Mã, Tên, Giá gốc, Giá KM</b></li>
                    <li>Ctrl + C để copy và Ctrl + V vào ô bên dưới</li>
                  </ol>
                </div>

                <textarea 
                  rows={8} 
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-[12px] font-mono focus:border-rose-500 focus:bg-white outline-none transition-all"
                  placeholder="Dán dữ liệu tổng từ Excel tại đây..."
                />

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <h4 className="text-[11px] font-black text-emerald-700 uppercase mb-1">Bước 2: Lọc mã cần in (Tùy chọn)</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Dán danh sách các mã SKU cần in (mỗi mã 1 dòng hoặc cách nhau bởi dấu phẩy). Bỏ trống nếu muốn in tất cả.</p>
                </div>

                <textarea 
                  rows={4} 
                  value={filterCodes}
                  onChange={(e) => setFilterCodes(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-[12px] font-mono focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  placeholder="VD: SKU001, SKU002..."
                />

                <div className="flex gap-2">
                  <button 
                    onClick={processPasteData} 
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95"
                  >
                    XỬ LÝ & LỌC DỮ LIỆU
                  </button>
                  <button 
                    onClick={() => { setPasteData(''); setFilterCodes(''); }} 
                    className="px-4 bg-slate-100 text-slate-400 hover:text-rose-600 rounded-2xl font-bold text-xs uppercase transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Tiêu đề Sticker</label>
                    <input 
                      type="text" 
                      value={globalPromoName}
                      onChange={(e) => setGlobalPromoName(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 focus:border-rose-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Thời hạn áp dụng</label>
                    <input 
                      type="text" 
                      value={globalDate}
                      onChange={(e) => setGlobalDate(e.target.value)}
                      placeholder="VD: 01/03 - 15/03" 
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="animate-in fade-in duration-200">
                {items.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 italic text-xs">
                    Chưa có sản phẩm nào được nhập
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-rose-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-white uppercase">{item.code}</span>
                          <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-rose-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => updateItemField(index, 'name', e.target.value)} 
                            className="w-full text-xs font-bold border-b border-slate-100 outline-none pb-1 focus:border-rose-400"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              value={item.price} 
                              onChange={(e) => updateItemField(index, 'price', e.target.value)} 
                              className="w-full text-[11px] bg-slate-50 p-2 rounded-lg border-none outline-none focus:ring-1 focus:ring-rose-400" 
                              placeholder="Giá gốc"
                            />
                            <input 
                              type="text" 
                              value={item.promoInput} 
                              onChange={(e) => updateItemField(index, 'promoInput', e.target.value)} 
                              className="w-full text-[11px] bg-rose-50 p-2 rounded-lg border-none text-rose-700 outline-none focus:ring-1 focus:ring-rose-400" 
                              placeholder="Giá KM/Quà"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <button 
              onClick={triggerPrint} 
              disabled={items.length === 0} 
              className="w-full bg-rose-600 disabled:bg-slate-100 disabled:text-slate-300 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-rose-100"
            >
              <Printer className="w-5 h-5" />
              <span>TIẾN HÀNH IN NGAY</span>
            </button>
          </div>
        </aside>

        <main className="print-area flex-1 bg-slate-100 overflow-y-auto p-12 relative print:overflow-visible print:p-0 print:bg-white">
          <div className="flex flex-col items-center print:block">
            {items.length === 0 ? (
              <div className="mt-32 text-center max-w-sm">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">Sẵn sàng in ấn</h2>
                <p className="text-slate-400 text-sm">Dữ liệu sau khi dán sẽ hiển thị các trang in tại đây.</p>
              </div>
            ) : (
              pages.map((pageItems, pageIndex) => (
                <div key={pageIndex} className="page-preview">
                  {pageItems.map((item, itemIndex) => {
                    const val = (item.promoInput || '').trim();
                    const numericOnly = val.replace(/[^0-9]/g, '');
                    const isDiscount = val !== '' && numericOnly.length >= 4 && (val.includes('.') || val.includes(',') || val.length === numericOnly.length);
                    const isGift = val !== '' && !isDiscount;

                    return (
                      <div key={itemIndex} className="sticker">
                        <div className="pattern-bg absolute inset-0 pointer-events-none"></div>
                        <div className="bg-rose-600 min-h-[55px] flex items-center px-4 py-2 border-b-4 border-rose-700">
                          <span className="font-black text-white text-[20px] uppercase tracking-tighter italic leading-none w-full text-center">
                            {globalPromoName || 'SIÊU SALE GIÁ SỐC'}
                          </span>
                        </div>
                        <div className="flex-grow flex flex-col items-center text-center p-5 justify-center z-10">
                          <h2 className="text-[18px] font-extrabold text-slate-900 leading-[1.2] uppercase line-clamp-2 mb-2 w-full">
                            {item.name || '---'}
                          </h2>
                          
                          {isDiscount ? (
                            <div className="mt-1">
                                <div className="text-slate-400 line-through text-[16px] font-medium leading-none mb-1">{formatMoney(item.price)}</div>
                                <div className="text-rose-600 font-black text-[50px] leading-none tracking-tighter">{formatMoney(numericOnly)}</div>
                            </div>
                          ) : isGift ? (
                            <div className="mt-1 w-full px-2">
                                <div className="text-rose-600 font-black text-[28px] leading-none mb-2">{formatMoney(item.price)}</div>
                                <div className="bg-rose-600 text-white rounded-xl p-3 border-b-4 border-rose-800">
                                    <div className="text-[9px] text-rose-100 font-bold uppercase tracking-widest mb-1">TẶNG KÈM</div>
                                    <div className="text-[13px] font-black uppercase line-clamp-2 leading-tight">{val}</div>
                                </div>
                            </div>
                          ) : (
                            <div className="mt-4">
                                <div className="text-slate-400 text-[11px] font-bold mb-1 uppercase tracking-widest">Giá Niêm Yết</div>
                                <div className="text-rose-600 font-black text-[50px] leading-none tracking-tighter">{formatMoney(item.price)}</div>
                            </div>
                          )}
                        </div>
                        <div className="h-10 bg-slate-50 flex justify-between items-center px-4 text-[9px] text-slate-500 border-t border-slate-100 z-10">
                          <span className="font-bold uppercase tracking-wider">SKU: {item.code}</span>
                          <span className="font-bold text-slate-700">{globalDate ? globalDate : 'CHƯƠNG TRÌNH KHUYẾN MÃI'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
