import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  X,
  Sparkles,
  Trophy,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Language = 'vi' | 'en';

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [language, setLanguage] = useState<Language>('en');

  const isVI = language === 'vi';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-[#1a1a1a] bg-white p-5 sm:p-7 shadow-[8px_8px_0_#1a1a1a] text-[#1a1a1a] z-10 custom-scrollbar"
          >
            {/* =========================================================
                HEADER
            ========================================================= */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-[#1a1a1a]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 shrink-0 bg-[#ff4d00] border-2 border-[#1a1a1a] flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] text-white">
                  <BookOpen className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-cyber font-extrabold text-lg sm:text-xl text-[#1a1a1a] tracking-tight uppercase">
                    {isVI ? 'GAME RULES' : 'GAME RULES'}
                  </h2>

                  <p className="text-[10px] text-[#1a1a1a]/60 font-mono tracking-wider">
                    {isVI
                      ? 'Protocol 21 // Hướng dẫn chiến thuật'
                      : 'Protocol 21 // Industrial Tactical Specification'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Language Toggle */}
                <div className="flex items-center border border-[#1a1a1a] bg-[#f8f7f4] p-0.5">
                  <button
                    type="button"
                    onClick={() => setLanguage('vi')}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      isVI
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
                    }`}
                  >
                    VI
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      !isVI
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
                    }`}
                  >
                    EN
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 bg-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* =========================================================
                CONTENT
            ========================================================= */}
            <div className="py-5 space-y-4 text-xs sm:text-sm leading-relaxed">

              {/* =======================================================
                  1. OVERVIEW
              ======================================================= */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#ff4d00]" />

                  <h3 className="font-mono font-bold text-sm tracking-wider uppercase">
                    {isVI
                      ? '1. TỔNG QUAN TRẬN ĐẤU'
                      : '1. MATCH OVERVIEW'}
                  </h3>
                </div>

                {isVI ? (
                  <div className="space-y-2 text-[#1a1a1a]/80">
                    <p>
                      Mỗi trận gồm <strong>3 Round</strong>. Mỗi Round, bạn được chia 6 lá bài ngẫu nhiên
                      chọn <strong>5 lá bài</strong> để đưa vào 3 Combat Box
                      nhằm ghi điểm.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 1
                        </div>
                        <div className="mt-1 font-bold">
                          6 lá → dùng 5
                        </div>
                      </div>

                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 2
                        </div>
                        <div className="mt-1 font-bold">
                          7 lá → dùng 5
                        </div>
                      </div>

                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 3
                        </div>
                        <div className="mt-1 font-bold">
                          8 lá → dùng 5
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[#1a1a1a]/80">
                    <p>
                      Each match consists of <strong>3 rounds</strong>.
                      In every round, deploy <strong>5 cards</strong> into
                      the 3 Combat Boxes to score points.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 1
                        </div>
                        <div className="mt-1 font-bold">
                          6 cards → use 5
                        </div>
                      </div>

                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 2
                        </div>
                        <div className="mt-1 font-bold">
                          7 cards → use 5
                        </div>
                      </div>

                      <div className="bg-white border border-[#1a1a1a] p-2.5">
                        <div className="font-mono font-bold text-[#ff4d00] text-[10px] uppercase">
                          ROUND 3
                        </div>
                        <div className="mt-1 font-bold">
                          8 cards → use 5
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =======================================================
                  2. DECK & CARRY OVER
              ======================================================= */}
              <div className="p-4 bg-white border border-[#1a1a1a]">
                <h3 className="font-mono font-bold text-sm tracking-wider uppercase flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[#ff4d00]" />
                  {isVI
                    ? '2. BỘ BÀI & CƠ CHẾ GIỮ BÀI'
                    : '2. DECK & CARD CARRY-OVER'}
                </h3>

                {isVI ? (
                  <div className="space-y-2.5 text-[#1a1a1a]/80">
                    <p>
                      <strong>21 lá bài:</strong> Các số từ 1–10, mỗi số có
                      2 lá + <strong className="text-[#ff4d00]">
                        1 Chameleon X
                      </strong>.
                    </p>

                    <div className="bg-[#f8f7f4] border border-[#1a1a1a] p-3 space-y-2">
                      <div className="font-bold text-[#1a1a1a]">
                        Lá không dùng sẽ được giữ lại
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div>
                          <strong>Round 1:</strong> Nhận 6 lá → dùng 5 → giữ 1 lá.
                        </div>
                        <div>
                          <strong>Round 2:</strong> Nhận +6 lá mới → có 7 lá → dùng
                          5 → giữ 2 lá.
                        </div>
                        <div>
                          <strong>Round 3:</strong> Nhận +6 lá mới → có 8 lá → dùng
                          5 → giữ 3 lá.
                        </div>
                      </div>
                    </div>

                    <p>
                      <strong>Deck Swap:</strong> Trong toàn bộ trận, mỗi
                      người chỉ được <strong>1 lần</strong> đổi 1 lá trên tay
                      lấy 1 lá ngẫu nhiên từ phần bài chưa dùng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-[#1a1a1a]/80">
                    <p>
                      <strong>21 cards:</strong> Cards 1–10, two copies each,
                      plus <strong className="text-[#ff4d00]">
                        1 Chameleon X
                      </strong>.
                    </p>

                    <div className="bg-[#f8f7f4] border border-[#1a1a1a] p-3 space-y-2">
                      <div className="font-bold">
                        Unused cards carry over
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div>
                          <strong>Round 1:</strong> 6 cards → deploy 5 →
                          keep 1.
                        </div>
                        <div>
                          <strong>Round 2:</strong> +6 new cards → 7 in hand
                          → deploy 5 → keep 2.
                        </div>
                        <div>
                          <strong>Round 3:</strong> +6 new cards → 8 in hand
                          → deploy 5 → keep 3.
                        </div>
                      </div>
                    </div>

                    <p>
                      <strong>Deck Swap:</strong> Once per match, exchange
                      1 card from your hand for 1 random card from the unused
                      deck.
                    </p>
                  </div>
                )}
              </div>

              {/* =======================================================
                  3. COMBAT BOXES
              ======================================================= */}
              <div className="space-y-3">
                <h3 className="font-mono font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#ff4d00]" />
                  {isVI
                    ? '3. BA MẶT TRẬN'
                    : '3. THREE COMBAT BOXES'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  {/* MAXIMA */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)]">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#ff4d00]">
                      BOX I
                    </div>

                    <div className="mt-1 text-sm font-cyber font-bold uppercase">
                      MAXIMA
                    </div>

                    <div className="mt-2 text-xs text-[#1a1a1a]/70">
                      {isVI ? (
                        <>
                          <strong>1 lá.</strong> Giá trị cao hơn sẽ thắng.
                          <br />
                          Chameleon X = <strong>10</strong>.
                        </>
                      ) : (
                        <>
                          <strong>1 card.</strong> Higher value wins.
                          <br />
                          Chameleon X = <strong>10</strong>.
                        </>
                      )}
                    </div>
                  </div>

                  {/* MINIMA */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)]">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#1a1a1a]">
                      BOX II
                    </div>

                    <div className="mt-1 text-sm font-cyber font-bold uppercase">
                      MINIMA
                    </div>

                    <div className="mt-2 text-xs text-[#1a1a1a]/70">
                      {isVI ? (
                        <>
                          <strong>2 lá.</strong> Tổng giá trị thấp hơn sẽ
                          thắng.
                          <br />
                          Chameleon X = <strong>0</strong>.
                        </>
                      ) : (
                        <>
                          <strong>2 cards.</strong> Lower total wins.
                          <br />
                          Chameleon X = <strong>0</strong>.
                        </>
                      )}
                    </div>
                  </div>

                  {/* PROXIMA */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)]">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#ff4d00]">
                      BOX III
                    </div>

                    <div className="mt-1 text-sm font-cyber font-bold uppercase">
                      PROXIMA
                    </div>

                    <div className="mt-2 text-xs text-[#1a1a1a]/70">
                      {isVI ? (
                        <>
                          <strong>2 lá.</strong> Cặp có tổng gần 15 nhất sẽ
                          thắng. Chameleon X = 0 hoặc 10 tùy theo cái nào có lợi hơn.
                        </>
                      ) : (
                        <>
                          <strong>2 cards.</strong> Pair with the sum closest
                          to 15 wins. Chameleon X resolves to 0 or 10.
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* =======================================================
                  4. BETTING
              ======================================================= */}
              <div className="p-4 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#ff4d00] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#ff4d00]" />
                    {isVI
                      ? '4. ĐẶT CƯỢC & ĐIỀU CHỈNH'
                      : '4. BETTING & READJUSTMENT'}
                  </h3>

                  <span className="px-2 py-0.5 bg-[#ff4d00] text-white text-[10px] font-mono font-bold shrink-0">
                    {isVI ? 'CHIẾN THUẬT' : 'TACTICAL SHIFT'}
                  </span>
                </div>

                {isVI ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold">① Đặt cược</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Mỗi Round, chọn <strong>1 Box</strong> mà bạn tin sẽ
                        thắng. Đối thủ sẽ nhìn thấy lựa chọn này.
                      </p>
                    </div>

                    <div>
                      <div className="font-bold">② Tính điểm</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Box được cược và thắng ={' '}
                        <strong className="text-[#ff4d00]">+2 điểm</strong>.
                        Nếu đang có Catch-up ={' '}
                        <strong className="text-[#ff4d00]">+4 điểm</strong>.
                        <br />
                        Box không cược nhưng thắng = <strong>+1 điểm</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="font-bold">③ Box nào được lật trước?</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Nếu cả hai cùng cược một Box → Box đó được lật trước.
                        <br />
                        Nếu cược khác nhau → Box không được ai cược sẽ được
                        lật trước.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1a1a1a]/15">
                      <div className="font-bold text-[#ff4d00]">
                        ④ Điều chỉnh giữa Round
                      </div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Sau khi Box đầu tiên được lật, cả hai người được phép
                        thay đổi và hoán đổi bài giữa <strong>2 Box còn lại </strong>
                         và <strong>lá dự trữ</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold">① Place a bet</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Each round, choose <strong>1 Box</strong> you believe
                        will win. Your opponent can see your choice.
                      </p>
                    </div>

                    <div>
                      <div className="font-bold">② Score</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        Win your bet Box ={' '}
                        <strong className="text-[#ff4d00]">+2 pts</strong>.
                        With Catch-up ={' '}
                        <strong className="text-[#ff4d00]">+4 pts</strong>.
                        <br />
                        Win an unbet Box = <strong>+1 pt</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="font-bold">③ First reveal</div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        If both players bet on the same Box → it reveals first.
                        <br />
                        If bets differ → the neutral unbet Box reveals first.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1a1a1a]/15">
                      <div className="font-bold text-[#ff4d00]">
                        ④ Mid-round readjustment
                      </div>
                      <p className="text-[#1a1a1a]/70 mt-0.5">
                        After the first Box is revealed, both players may
                        rearrange cards between the <strong>2 remaining
                        Boxes</strong> and their <strong>reserve card</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* =======================================================
                  5. TIE / CATCH-UP / VICTORY
              ======================================================= */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] space-y-3">
                <h3 className="font-mono font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#ff4d00]" />
                  {isVI
                    ? '5. HÒA, CATCH-UP & CHIẾN THẮNG'
                    : '5. TIES, CATCH-UP & VICTORY'}
                </h3>

                {isVI ? (
                  <div className="space-y-2.5">
                    <div>
                      <strong>Hòa điểm trong Round:</strong>{' '}
                      Nếu hai người hòa điểm Round (ví dụ 2–2, 1–1 hoặc 0–0),
                      cộng tổng 5 lá đã triển khai. Người có tổng cao hơn nhận
                      <strong className="text-[#ff4d00]"> +1 điểm bonus</strong>.
                    </div>

                    <div>
                      <strong>Catch-up:</strong>{' '}
                      Người thua Round sẽ nhận quyền{' '}
                      <strong className="text-[#ff4d00]">
                        Double Bet
                      </strong>{' '}
                      ở Round tiếp theo. Nếu thắng Box đã cược ={' '}
                      <strong className="text-[#ff4d00]">+4 điểm</strong>.
                    </div>

                    <div>
                      <strong>Thắng trận:</strong>{' '}
                      Sau 3 Round, người có tổng điểm cao hơn sẽ thắng.
                    </div>

                    <div>
                      <strong>Nếu tổng điểm trận vẫn hòa:</strong>{' '}
                      Cộng giá trị của <strong>3 lá dự trữ</strong> đã giữ lại
                      qua 3 Round. Người có tổng cao hơn thắng.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <strong>Round tie:</strong>{' '}
                      If round points are tied (e.g. 2–2, 1–1 or 0–0), add up
                      the 5 deployed cards. Higher total receives a
                      <strong className="text-[#ff4d00]"> +1 bonus point</strong>.
                    </div>

                    <div>
                      <strong>Catch-up:</strong>{' '}
                      The player who loses a round gets{' '}
                      <strong className="text-[#ff4d00]">
                        Double Bet
                      </strong>{' '}
                      in the next round. Winning the bet Box ={' '}
                      <strong className="text-[#ff4d00]">+4 pts</strong>.
                    </div>

                    <div>
                      <strong>Match victory:</strong>{' '}
                      After 3 rounds, the player with the highest total score
                      wins.
                    </div>

                    <div>
                      <strong>Final tie:</strong>{' '}
                      If match points are still tied, add the values of the
                      <strong> 3 reserve cards</strong>. Higher total wins.
                    </div>
                  </div>
                )}
              </div>

              
            </div>

            {/* =========================================================
                FOOTER
            ========================================================= */}
            <div className="pt-3 border-t-2 border-[#1a1a1a] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#ff4d00] hover:bg-[#e04400] text-white font-mono font-bold text-xs tracking-wider shadow-[3px_3px_0_#1a1a1a] border border-[#1a1a1a] transition-all cursor-pointer"
              >
                {isVI ? 'ĐÃ HIỂU LUẬT' : 'PROTOCOL UNDERSTOOD'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};