  /* ====================== Scene 5 · 尋蹤（手繪活點地圖） ======================
     The last chapter is a folded paper map, and a map is a different kind of
     picture from the five before it. Those are places you stand inside and
     turn your head in, so the renderer fits each one the short way round and
     crops whatever hangs off the other axis. A map cannot be cropped: the
     whole sheet has to be on the screen at once, because looking across it
     is the entire point. That is what the renderer's contain fit exists for,
     and this is the only chapter that asks for it. There is no panning here
     either, for the same reason: there is nowhere to pan to.

     Eleven buildings are cut out of this sheet, and all eleven hop. None of
     them is a separate picture laid on top: they are painted into the paper,
     so lifting one means resampling that part of the painting a little
     higher up, tipped a degree or two and grown a few per cent about its own
     middle. The mask carries the name of whichever building each pixel
     belongs to and where that pixel sits on it, which is how the shader can
     tip eleven stickers about eleven different middles without being handed
     a list to search.

     Laid over the top there is only what is not part of the drawing: a warm
     light at the way in to each place still to be found, the seal once it is
     finished, and what the map does when you have been everywhere. The dark
     brown footprints this file used to draw are gone. The artwork has its
     own, painted pale by hand, and the drawn ones sat across the clinic's
     name and across the buildings themselves.

     The positions are all fractions of the artwork rather than fractions of
     the screen, and they are converted at the last moment. A percentage of
     the viewport would put the chapel on the chapel at one window size and
     in the river at another. */
  (function () {
    'use strict';

    const MAP5  = 's5/map5.webp';     /* baked into index.html as a data URI */
    const MASK5 = 's5/mask5.png';
    const CARDS = ['s5/postcard-1.webp',  's5/postcard-2.webp',
                   's5/postcard-3.webp',  's5/postcard-4.webp',
                   's5/postcard-5.webp',  's5/postcard-6.webp',
                   's5/postcard-7.webp',  's5/postcard-8.webp',
                   's5/postcard-9.webp',  's5/postcard-10.webp',
                   's5/postcard-11.webp', 's5/postcard-12.webp'];
    /* The strip under the big card. These are 252 pixels wide rather than
       1800, because a background image is decoded at its own size and not
       at the size of the box it is shown in: the strip is twelve pictures
       eighty four pixels across, and using the cards themselves there cost
       a phone twelve full decodes the moment the gallery opened. */
    const THUMBS = ['s5/thumb-1.webp',  's5/thumb-2.webp',  's5/thumb-3.webp',
                    's5/thumb-4.webp',  's5/thumb-5.webp',  's5/thumb-6.webp',
                    's5/thumb-7.webp',  's5/thumb-8.webp',  's5/thumb-9.webp',
                    's5/thumb-10.webp', 's5/thumb-11.webp', 's5/thumb-12.webp'];

    const IW = 2576, IH = 1274, PANO_A = IW / IH;

    /* The whole look, every uniform of it, because the renderer is left
       wherever the chapter before this one put it and a value left unsaid
       is inherited rather than defaulted.

       Almost all of it is nought. The first version of this chapter moved
       the reeds, the loose leaves, the river and the painted wash in the
       margin, and a map that ripples is a map you cannot read: watched for
       any length of time it makes the paper look like water. So the paper
       holds still. What moves is the eleven buildings, the four drawn stars
       breathing very slowly, and the sailboat riding about a pixel and a
       half. Everything else waits to be touched.

       lift and boat are set from the screen rather than written down,
       because eleven pixels means eleven pixels whatever size the map is
       being shown at. pushScale works them out. */
    const LOOK = {
      warm: 0.0, disp: 0.0, swell: 0.0, glint: 0.0,
      gf: 5.00, gsharp: 2.00, heel: 0.0,
      wind: 0.0, cloud: 0.0, cdrift: 0.0,
      fit: 1.0, spark: 0.070,
      lift: 0.0, liftHot: -1.0, liftAmt: 0.0,
      liftDone: 0.0, liftDone2: 0.0, boat: 0.0,
    };

    /* How far, in screen pixels, each of the two moving things moves. The
       hop is eleven pixels at its fullest, which is what a sticker reaches
       when a finger is on it; left alone it goes to 0.818 of that, which is
       the nine pixels. */
    const HOP_PX  = 11.0;
    const BOAT_PX = 1.5;
    const IDLE    = 0.818;

    /* ---------------- where everything is, as fractions of the map ----------------
       Measured off the artwork by drawing every box onto it and looking,
       three times. The first set had the chapel's box on the right half of
       the chapel and the monument's on the grass beside it; the second cut
       the roof off the tower. These are the boxes the mask was built from,
       so the paper that lifts and the thing you press are the same thing. */
    const HOT = {
      chapel:    [0.058, 0.592, 0.178, 0.836],
      steps:     [0.430, 0.448, 0.552, 0.610],
      hospital:  [0.220, 0.646, 0.352, 0.880],
      oxford:    [0.303, 0.368, 0.422, 0.506],
      obelisk:   [0.700, 0.074, 0.886, 0.322],
      goniu:     [0.056, 0.150, 0.230, 0.312],
      boksu:     [0.241, 0.116, 0.380, 0.312],
      cottage:   [0.113, 0.320, 0.292, 0.450],
      shophouse: [0.560, 0.272, 0.666, 0.434],
      customs:   [0.574, 0.520, 0.698, 0.684],
      tower:     [0.793, 0.545, 0.890, 0.864],
      birdA:     [0.066, 0.381, 0.108, 0.436],
      birdB:     [0.181, 0.555, 0.222, 0.607],
    };
    const BANYAN = [0.321, 0.633, 0.418, 0.853];

    /* The eleven places, numbered exactly as the mask numbers them: the
       five that carry a seal first, then the six side trips. A side trip
       asks one question and gives a small 已探 stamp; a main station asks
       two and gives one of the five. The map may be walked in any order. */
    const MAIN = ['chapel', 'steps', 'hospital', 'oxford', 'obelisk'];
    const SIDE = ['goniu', 'boksu', 'cottage', 'shophouse', 'customs', 'tower'];
    const PLACES = MAIN.concat(SIDE);
    const NO = {};  PLACES.forEach((key, i) => { NO[key] = i + 1; });

    /* The name each sticker answers to, written into the mask's green
       channel as a twelfth and read back by the shader. A single channel
       cannot carry eleven clocks, so it carries eleven names and the clock
       comes out of the name; it is also how the shader knows which one
       sticker the pointer is on without being handed a position. */
    const PHASE = {};  PLACES.forEach(key => { PHASE[key] = NO[key] / 12; });

    /* The hop each building is on, worked out from its number exactly the
       way the shader works it out, so the light at the door and the paper
       it sits on rise together instead of arguing. Two and a half to three
       and a half seconds apiece, each starting three tenths of a second
       after the one before. */
    function cycleOf(key) { return 2.5 + (NO[key] % 3) * 0.5; }
    function hopAt(key, t) {
      if (reduce) return 0;
      const cyc = cycleOf(key);
      let u = ((t - (NO[key] - 1) * 0.30) / cyc) % 1;
      if (u < 0) u += 1;
      const d = 0.42 / cyc;
      if (u < d) return Math.sin(Math.PI * u / d);
      if (u < d * 1.5) return Math.max(0, 0.18 * Math.sin(6.2832 * (u - d) / d));
      return 0;
    }

    /* Where the little warm light sits: at the way in, at the foot of the
       steps, at the door, at the base of the monument. Not in the middle
       of the sticker, because the middle of a building is its roof. */
    const DOT = {
      chapel:    [0.118, 0.822], steps:     [0.470, 0.580],
      hospital:  [0.262, 0.858], oxford:    [0.352, 0.490],
      obelisk:   [0.770, 0.300], goniu:     [0.135, 0.296],
      boksu:     [0.300, 0.295], cottage:   [0.200, 0.433],
      shophouse: [0.612, 0.418], customs:   [0.634, 0.658],
      tower:     [0.835, 0.848],
    };

    /* ====================== the seals ======================
       Every seal on this map and every empty ring on the slip comes out of
       one function, so there is exactly one place to change how a seal
       looks. None of it is a circle. A ring drawn with border-radius is a
       perfect circle by construction, and a perfect circle is the one thing
       a hand cut sticker and a rubber stamp both fail to be; next to five
       chapters of watercolour it read as a button.

       What is drawn, from the bottom up: a torn white paper base, then the
       ink. The ink is a thick outer ring, a thin inner one and the two
       characters, all three pushed about by the same turbulence filter and
       taken down a fifth across the middle by the same gradient, which is
       what makes them look like one impression of one stamp rather than
       three shapes that happen to be the same colour. */
    const INK = { blue: '#2B4C7E', red: '#A93628' };

    /* A small deterministic generator, so that 起航 is torn the same way
       every time the page is opened and 友善 is torn differently. */
    function seeded(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      let s = h >>> 0;
      return function () {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }

    /* A closed loop through n points, written out as cubic beziers. The
       points sit on a circle of radius r that has been pulled out of true
       twice over: a slow two and three lobed swell, which is how a hand
       cut edge and a hand pressed stamp both actually go wrong, and then a
       little noise on top of it.

       The lobes are small and the points are many. The first version had
       them four times this size over eleven points, and a six unit stroke
       laid along a path that swings that far over so few points doubles
       back on itself at the turns: the rings came out lumpy and a wedge of
       ink spilled past the outer one onto the paper. A stamp is a circle
       that somebody pressed by hand, not a splat. */
    function blob(r, n, amp, lobe, rnd) {
      const a0 = rnd() * 6.2832, a1 = rnd() * 6.2832;
      const l2 = lobe * (0.6 + rnd() * 0.8), l3 = lobe * (0.4 + rnd() * 0.7);
      const p = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.2832;
        const rr = r * (1 + l2 * Math.sin(a * 2 + a0) + l3 * Math.sin(a * 3 + a1))
                 + (rnd() - 0.5) * 2 * amp;
        p.push([50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr]);
      }
      const f = v => Math.round(v * 100) / 100;
      let d = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
      for (let i = 0; i < n; i++) {
        const q0 = p[(i - 1 + n) % n], q1 = p[i],
              q2 = p[(i + 1) % n], q3 = p[(i + 2) % n];
        d += 'C' + f(q1[0] + (q2[0] - q0[0]) / 6) + ' ' + f(q1[1] + (q2[1] - q0[1]) / 6)
           + ' ' + f(q2[0] - (q3[0] - q1[0]) / 6) + ' ' + f(q2[1] - (q3[1] - q1[1]) / 6)
           + ' ' + f(q2[0]) + ' ' + f(q2[1]);
      }
      return d + 'Z';
    }

    /* text   the two characters cut into the stamp
       tone   'blue' or 'red'
       opts   empty: an unearned slot, drawn as a faint dashed ring
              tag:   anything, to tear two seals of the same name apart */
    function renderWatercolorStamp(text, tone, opts) {
      opts = opts || {};
      const rnd = seeded(text + '|' + (opts.tag || '') + '|' + (opts.empty ? 'o' : 'x'));
      const v = Math.floor(rnd() * 4);
      const tilt = (rnd() * 10 - 5).toFixed(2);
      /* The paper is torn, so it is the one with real wobble in it, at a
         high enough frequency to read as a torn edge rather than a wave.
         The two rings are nearly round and only waver. */
      const base  = blob(45.5, 22, 1.0, 0.016, rnd);
      const outer = blob(38.5, 16, 0.55, 0.012, rnd);
      const inner = blob(32.0, 14, 0.45, 0.010, rnd);
      const ink = INK[tone] || INK.blue;
      const size = text.length > 2 ? 21 : 29;

      /* Everything above is laid out on a hundred unit square, and then
         drawn one and a half times that size inside a box of a hundred and
         fifty. The paths, the two stroke widths and the type all scale
         together, so the stamp has exactly the proportions it had before;
         what does not scale is the filter, which works in the outer box.
         Three and a half units of displacement over a hundred is a kink
         every fifteen units and the rings came out visibly faceted, like a
         stamp cut from a potato. Over a hundred and fifty, the same three
         and a half is the fine waver of something pressed by hand, which
         is what the reference impression has. */
      const G = '<g transform="scale(1.5)">';

      if (opts.empty) {
        /* Nothing has been earned here yet, so there is no ink and no
           paper: only the shape of the ring that is missing, dashed, and
           the name of it so the slip says which one rather than how many. */
        return '<svg class="s5-stamp is-empty" viewBox="0 0 150 150" aria-hidden="true">'
          + '<g transform="rotate(' + tilt + ' 75 75)">' + G
          + '<path d="' + outer + '" fill="none" stroke="' + ink
          + '" stroke-width="1.5" stroke-dasharray="4.5 5.5" stroke-linecap="round"'
          + ' opacity="0.34"/>'
          + '<text class="s5-stamp-t" x="50" y="50" dy="0.34em" text-anchor="middle"'
          + ' font-size="' + size + '" fill="' + ink + '" opacity="0.24">' + text + '</text>'
          + '</g></g></svg>';
      }

      return '<svg class="s5-stamp" viewBox="0 0 150 150" role="img" aria-label="'
        + text + '">'
        /* the hand cut sticker the stamp sits on */
        + G
        + '<path d="' + base + '" fill="#FEFCF7"/>'
        + '<path d="' + base + '" fill="none" stroke="rgba(120, 96, 58, .18)" stroke-width="0.6"/>'
        + '</g>'
        /* and the impression itself, all of it under one filter and one mask */
        + '<g filter="url(#s5-wc-' + v + ')" mask="url(#s5-wm-' + v + ')"'
        + ' transform="rotate(' + tilt + ' 75 75)">' + G
        + '<path d="' + outer + '" fill="none" stroke="' + ink
        + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<path d="' + inner + '" fill="none" stroke="' + ink + '" stroke-width="1.8"/>'
        + '<text class="s5-stamp-t" x="50" y="50" dy="0.34em" text-anchor="middle"'
        + ' font-size="' + size + '" fill="' + ink + '">' + text + '</text>'
        + '</g></g></svg>';
    }

    function stampInto(el, text, tone, opts) {
      el.innerHTML = renderWatercolorStamp(text, tone, opts);
    }

    /* Which of the two inks a place stamps in. The five main seals alternate
       so no two neighbours on the slip are the same colour; every side trip
       is brick red, which is what the reference impression is. */
    function toneOf(key) {
      const i = MAIN.indexOf(key);
      return i < 0 ? 'red' : (i % 2 === 0 ? 'blue' : 'red');
    }

    const T5 = {
      zh: {
        hint: '點地圖上發亮的建築，收集五枚主線印章',
        hintDrag: '左右拖曳看地圖　點發亮的建築，收集五枚主線印章',
        prog: '馬偕足跡收集',
        close: '閉', closeAria: '關閉卡片',
        take: '收下印章', takeSide: '收下見聞郵戳',
        ok: '知道了',
        right: '答對了。',
        wrong: '不是這個。再想想看。',
        next: '答對了，還有一題。',
        allDone: '五枚主線印章到齊了',
        badge: '全地圖制霸',
        sideDone: '已探',
        step: function (i, n) { return '第 ' + i + ' 題，共 ' + n + ' 題'; },
        tally: function (m, s) {
          return "MACKAY'S FOOTPRINTS · 主線 " + m + '/5 ｜ 支線見聞 ' + s + '/6';
        },
        gal: {
          t: '馬偕紀念明信片',
          s: '十二張明信片任選一張，下載的就是完整原圖。',
          dl: '下載今日紀念明信片',
          note: '手機或 LINE 瀏覽器若無法直接下載，請長按上方明信片儲存至相簿',
          prev: '上一張', next: '下一張',
        },
        st: {
          chapel: {
            k: 'I · 主線印章', t: '淡水禮拜堂', seal: '起航', seal2: '起航・淡水',
            b: '1871 年 10 月他從加拿大啟程，繞過大半個地球，1872 年 3 月 9 日在滬尾上岸。那一年他二十七歲，不會說一句台語。',
            qs: [
              { q: '1872 年馬偕乘船遠渡重洋，踏上北台灣的第一站是哪裡？',
                o: ['滬尾，也就是今天的淡水', '雞籠，也就是今天的基隆', '艋舺，也就是今天的萬華'], a: 0 },
              { q: '馬偕初到淡水時完全不會說台語，他最初是透過什麼方式學習？',
                o: ['向田邊放牛的牧童一句一句請教', '靠隨身帶來的英台字典自修', '等加拿大再派一位翻譯過來'], a: 0 },
            ],
          },
          steps: {
            k: 'II · 主線印章', t: '山城階梯', seal: '友善', seal2: '友善・足跡',
            b: '上岸之後他沒有先蓋教堂，而是先學話。他跟牧童在田邊學台語，走進街巷，替人看牙。信任是一顆一顆牙換來的。',
            qs: [
              { q: '面對初登滬尾時當地居民的戒心，馬偕如何走入人群建立信任？',
                o: ['走入街巷與孩童互動，並為民眾免費看診', '先蓋一座大教堂讓人來參觀', '請官府出面替他引介'], a: 0 },
              { q: '馬偕在淡水街巷行醫時，最廣為人知的義診服務是什麼？',
                o: ['為飽受牙痛之苦的居民免費拔牙', '免費替人接骨', '免費替人配眼鏡'], a: 0 },
            ],
          },
          hospital: {
            k: 'III · 主線印章', t: '滬尾偕醫館', seal: '仁心', seal2: '仁心・濟世',
            b: '1879 年落成，是台灣北部第一所西式醫院。他拔牙、治瘧疾、處理外傷，一天看過上百人。',
            qs: [
              { q: '1879 年落成的「滬尾偕醫館」在台灣醫療史上有什麼地位？',
                o: ['台灣北部第一所西式醫院', '台灣第一所中醫學校', '台灣第一所獸醫院'], a: 0 },
              { q: '馬偕從國外引進哪一種特效藥，救治了無數罹患瘧疾的淡水居民？',
                o: ['奎寧，也就是金雞納霜', '盤尼西林', '嗎啡'], a: 0 },
            ],
          },
          oxford: {
            k: 'IV · 主線印章', t: '牛津學堂', seal: '信心', seal2: '信心・啟蒙',
            b: '1882 年他用家鄉牛津郡募來的錢蓋了理學堂大書院。兩年後，淡水女學堂開辦，學費、膳宿全免。',
            qs: [
              { q: '1882 年馬偕用家鄉牛津郡募來的款項，興建了哪座中西合璧的學府？',
                o: ['理學堂大書院，也就是牛津學堂', '台南神學院', '淡江中學'], a: 0 },
              { q: '馬偕隨後創辦台灣第一所女子學校「淡水女學堂」，打破了當時什麼傳統？',
                o: ['女子無才便是德，他讓女孩也能免費受教育', '只有官家子弟能讀書', '學堂一律不收本地學生'], a: 0 },
            ],
          },
          obelisk: {
            k: 'V · 主線印章', t: '馬偕墓園', seal: '忠信', seal2: '忠信・永恆',
            b: '1901 年 6 月 2 日他病逝於淡水。從上岸那天算起，他在這裡待了二十九年。',
            qs: [
              { q: '馬偕一生奉獻台灣二十九年，他最廣為流傳的信念格言是什麼？',
                o: ['寧願燒盡，不願鏽壞', '讀萬卷書，行萬里路', '飲水思源，落葉歸根'], a: 0 },
              { q: '1901 年馬偕病逝於淡水後，依照遺願安葬於何處？',
                o: ['淡水淡江中學校園內的馬偕墓園', '加拿大安大略省的家鄉', '台北的外僑公墓'], a: 0 },
            ],
          },
          goniu: {
            k: '支線見聞', t: '姑娘樓', seal: '已探', seal2: '已探・姑娘樓',
            b: '1906 年由吳威廉牧師興建的紅磚洋樓，是淡水兩所女學校女校長的宿舍。住在裡面的單身女宣教師，淡水人就叫她們「姑娘」，樓因此得名。',
            qs: [
              { q: '「姑娘樓」這個名字是怎麼來的？',
                o: ['住在裡面的是女宣教師，淡水人稱她們「姑娘」', '因為它蓋得特別秀氣', '因為門口有一座少女石像'], a: 0 },
            ],
          },
          boksu: {
            k: '支線見聞', t: '牧師樓', seal: '已探', seal2: '已探・牧師樓',
            b: '1909 年吳威廉牧師為自己蓋的紅磚洋樓，就在姑娘樓隔壁，後來住過好幾位宣教師。它和姑娘樓都屬於馬偕之後的年代：他走了，工作還在繼續。',
            qs: [
              { q: '牧師樓這一類淡水紅磚洋樓，最明顯的建築特色是什麼？',
                o: ['繞著屋子的紅磚拱圈迴廊，用來擋亞熱帶的日曬與風雨', '屋頂鋪了整片的琉璃瓦', '整棟沒有一扇窗戶'], a: 0 },
            ],
          },
          cottage: {
            k: '支線見聞', t: '馬偕最初的租屋處', seal: '已探', seal2: '已探・落腳',
            b: '剛到滬尾時他租不到像樣的房子，最後住進一間潮濕的馬廄改成的平房。那間屋子同時是他的家、他的診間，也是他第一個講道的地方。',
            qs: [
              { q: '馬偕初抵滬尾租下的第一個落腳處，原本是什麼？',
                o: ['一間潮濕的馬廄，他整理後住了進去', '一座空置的官府衙門', '一艘停在河邊的舊船'], a: 0 },
            ],
          },
          shophouse: {
            k: '支線見聞', t: '淡水街屋', seal: '已探', seal2: '已探・街市',
            b: '他每天走過的老街，是淡水最熱鬧的地方。1878 年他娶了台灣女子張聰明，從此不只是住在這裡的外國人，而是這條街上的一家人。',
            qs: [
              { q: '1878 年馬偕與台灣女子張聰明成婚，這件事在當時代表什麼？',
                o: ['他選擇真正落腳在地，與淡水人成為一家人', '他準備帶著家人回加拿大定居', '這是官府指派的政治聯姻'], a: 0 },
            ],
          },
          customs: {
            k: '支線見聞', t: '小白宮', seal: '已探', seal2: '已探・海關',
            b: '前清淡水關稅務司官邸，一棟白牆拱廊的洋樓。馬偕上岸的年代，淡水正因為開港通商而成為北台灣最重要的門戶，船來船往。',
            qs: [
              { q: '馬偕抵台的年代，淡水港在北台灣扮演什麼角色？',
                o: ['開港通商後最重要的對外門戶', '只是一個封閉的小漁村', '專門停泊軍艦的要塞'], a: 0 },
            ],
          },
          tower: {
            k: '支線見聞', t: '紅磚古蹟高塔', seal: '已探', seal2: '已探・古蹟',
            b: '淡水的老地標，三百多年來換過好幾個主人：西班牙人、荷蘭人、清廷，後來是英國領事館。馬偕住在淡水的那些年，這裡正是各種語言與旗幟交會的地方。',
            qs: [
              { q: '這座三百多年的紅磚古蹟，見證了淡水什麼樣的特色？',
                o: ['多元文化在此交匯，換過好幾個主人', '從頭到尾只屬於同一個國家', '它其實是近年才蓋的仿古建築'], a: 0 },
            ],
          },
        },
        egg: {
          bird: { t: '河口的候鳥', b: '河口是候鳥的驛站，每年牠們都回來。' },
        },
      },
      en: {
        hint: 'Press the buildings that glow. Five seals to collect.',
        hintDrag: 'Drag the map sideways. Press the buildings that glow, five seals to collect.',
        prog: 'Seals collected',
        close: 'x', closeAria: 'Close card',
        take: 'Take the seal', takeSide: 'Take the mark',
        ok: 'Got it',
        right: 'That is right.',
        wrong: 'Not that one. Have another look.',
        next: 'Right. One more here.',
        allDone: 'All five seals',
        badge: 'The whole map',
        sideDone: 'Visited',
        step: function (i, n) { return 'Question ' + i + ' of ' + n; },
        tally: function (m, s) {
          return "MACKAY'S FOOTPRINTS · Seals " + m + '/5 | Side visits ' + s + '/6';
        },
        gal: {
          t: 'Mackay memorial postcards',
          s: 'Pick any of the twelve. What you download is the card itself, whole.',
          dl: "Download today's postcard",
          note: 'If your phone or the LINE browser will not download it, press and hold the postcard above to save it to your photos',
          prev: 'Previous', next: 'Next',
        },
        st: {
          chapel: {
            k: 'I · Main seal', t: 'Tamsui Chapel', seal: '起航', seal2: 'Setting out',
            b: 'He left Canada in October 1871, went most of the way round the world, and came ashore at Hobe on 9 March 1872. He was twenty-seven and could not speak a word of Taiwanese.',
            qs: [
              { q: 'Where did Mackay first set foot in northern Taiwan, in 1872?',
                o: ['Hobe, which is Tamsui today', 'Kelung, which is Keelung today', 'Bangka, which is Wanhua today'], a: 0 },
              { q: 'He arrived without a word of Taiwanese. How did he start learning it?',
                o: ['A phrase at a time from the herd boys at the edge of the fields',
                    'From a dictionary he had brought with him',
                    'He waited for Canada to send an interpreter'], a: 0 },
            ],
          },
          steps: {
            k: 'II · Main seal', t: 'The hill steps', seal: '友善', seal2: 'Walking in',
            b: 'He did not start with a chapel. He started with the language, learning it from herd boys at the edge of the fields, walking the lanes, pulling teeth. Trust came one tooth at a time.',
            qs: [
              { q: 'Faced with a wary town, how did Mackay get among people?',
                o: ['He walked the lanes with the children and treated people for nothing',
                    'He built a large chapel and waited for visitors',
                    'He had the magistrate introduce him'], a: 0 },
              { q: 'What was the free treatment he became best known for?',
                o: ['Pulling the teeth of people worn out by toothache',
                    'Setting broken bones', 'Fitting spectacles'], a: 0 },
            ],
          },
          hospital: {
            k: 'III · Main seal', t: 'Hobe Mackay Hospital', seal: '仁心', seal2: 'Care',
            b: 'Opened in 1879, the first western hospital in northern Taiwan. He pulled teeth, treated malaria and dressed wounds, a hundred people in a day.',
            qs: [
              { q: 'What was the Hobe Mackay Hospital of 1879?',
                o: ['The first western hospital in northern Taiwan',
                    "Taiwan's first school of Chinese medicine",
                    "Taiwan's first veterinary hospital"], a: 0 },
              { q: 'Which drug did he bring in that saved so many people here from malaria?',
                o: ['Quinine, from cinchona bark', 'Penicillin', 'Morphine'], a: 0 },
            ],
          },
          oxford: {
            k: 'IV · Main seal', t: 'Oxford College', seal: '信心', seal2: 'Schooling',
            b: 'In 1882 he built Oxford College with money raised in his home county in Ontario. Two years later the Tamsui Girls School opened, with no fees, board or lodging to pay.',
            qs: [
              { q: 'What did Mackay build in 1882 with money raised in Oxford County, Ontario?',
                o: ['Oxford College, Li-Hak-Tong Tai-Su-Inn',
                    'Tainan Theological College', 'Tamkang High School'], a: 0 },
              { q: 'The Tamsui Girls School, the first school for girls in Taiwan, broke with what?',
                o: ['The idea that girls had no business being taught, so girls were taught free',
                    'The rule that only officials sons could study',
                    'A ban on admitting local students'], a: 0 },
            ],
          },
          obelisk: {
            k: 'V · Main seal', t: "Mackay's grave", seal: '忠信', seal2: 'Faithful',
            b: 'He died at Tamsui on 2 June 1901. Counting from the day he landed, he had been here twenty-nine years.',
            qs: [
              { q: 'Which saying of his is the one people still repeat?',
                o: ['Rather burn out than rust out', 'Read ten thousand books, walk ten thousand miles',
                    'Remember the spring when you drink'], a: 0 },
              { q: 'Where was he buried, as he had asked to be?',
                o: ['In the grounds of what is now Tamkang High School, at Tamsui',
                    'In his home county in Ontario', 'In the foreign cemetery at Taipei'], a: 0 },
            ],
          },
          goniu: {
            k: 'Side visit', t: 'Go-Niu Lao', seal: '已探', seal2: 'Visited',
            b: 'A red brick house put up in 1906 by William Gauld, for the principals of the two girls schools at Tamsui. The single women missionaries who lived in it were called Go-Niu, and the house took their name.',
            qs: [
              { q: 'Where does the name Go-Niu Lao come from?',
                o: ['The women missionaries who lived there, whom the town called Go-Niu',
                    'The delicate way it was built', 'A statue of a girl by the door'], a: 0 },
            ],
          },
          boksu: {
            k: 'Side visit', t: 'Bok-Su Lao', seal: '已探', seal2: 'Visited',
            b: 'William Gauld built this one for himself in 1909, right next door, and several missionaries lived in it after him. Both houses belong to the years after Mackay: he was gone, and the work went on.',
            qs: [
              { q: 'What is the clearest feature of a Tamsui red brick house like this one?',
                o: ['An arcaded brick veranda round the house, against the sun and the rain',
                    'A roof laid entirely in glazed tiles', 'No windows at all'], a: 0 },
            ],
          },
          cottage: {
            k: 'Side visit', t: 'His first rented house', seal: '已探', seal2: 'Visited',
            b: 'Newly arrived, he could not rent anything decent, and ended up in a damp converted stable. That one room was his home, his surgery and the first place he preached.',
            qs: [
              { q: 'What had his first lodging at Hobe been before he moved in?',
                o: ['A damp stable, which he cleaned out and lived in',
                    'An empty government office', 'An old boat moored on the river'], a: 0 },
            ],
          },
          shophouse: {
            k: 'Side visit', t: 'The old street', seal: '已探', seal2: 'Visited',
            b: 'The street he walked every day was the busiest part of Tamsui. In 1878 he married a Taiwanese woman, Tiu Chhang-Mia, and stopped being a foreigner living here: he was family on this street.',
            qs: [
              { q: 'What did his marriage to Tiu Chhang-Mia in 1878 mean?',
                o: ['He had chosen to belong here, and became family to Tamsui',
                    'He was preparing to take a family back to Canada',
                    'It was a match arranged by the magistrate'], a: 0 },
            ],
          },
          customs: {
            k: 'Side visit', t: 'The Little White House', seal: '已探', seal2: 'Visited',
            b: 'The Qing customs officer’s residence, white walls and an arcade. In the years Mackay landed, Tamsui was the most important way in and out of northern Taiwan, and the ships came and went.',
            qs: [
              { q: 'What was the port of Tamsui in the years Mackay arrived?',
                o: ['The most important way in and out of northern Taiwan',
                    'A closed fishing village', 'A fortress for warships only'], a: 0 },
            ],
          },
          tower: {
            k: 'Side visit', t: 'The red brick fort', seal: '已探', seal2: 'Visited',
            b: 'The old landmark of Tamsui, which has changed hands several times in three hundred years: Spanish, Dutch, Qing, and then a British consulate. In Mackay’s years here it was where the languages and the flags met.',
            qs: [
              { q: 'What does this three hundred year old landmark say about Tamsui?',
                o: ['Several cultures met here, and it changed hands more than once',
                    'It belonged to one country throughout',
                    'It was actually built recently in an old style'], a: 0 },
            ],
          },
        },
        egg: {
          bird: { t: 'Birds at the river mouth', b: 'The estuary is a staging post. They come back every year.' },
        },
      },
    };

    /* ---------------- the page ---------------- */
    const s5 = document.getElementById('s5');
    const cv = document.getElementById('traces-fx-canvas');
    const hintEl = document.getElementById('s5-hint');
    const card = document.getElementById('s5-card');
    const gal  = document.getElementById('s5-gal');
    if (!s5 || !cv || !card || !gal) return;

    const ctx = cv.getContext('2d', { alpha: true });
    const cardX = document.getElementById('s5-card-x');
    const cardK = document.getElementById('s5-card-k');
    const cardT = document.getElementById('s5-card-t');
    const cardB = document.getElementById('s5-card-b');
    const cardS = document.getElementById('s5-card-s');
    const cardQ = document.getElementById('s5-card-q');
    const cardV = document.getElementById('s5-card-v');
    const quizEl = document.getElementById('s5-quiz');
    const optsEl = document.getElementById('s5-opts');
    const goEl   = document.getElementById('s5-card-go');
    const progEl = document.getElementById('s5-prog');
    const progT  = document.getElementById('s5-prog-t');
    const progEn = document.getElementById('s5-prog-en');
    const badgeEl = document.getElementById('s5-prog-badge');
    const slotsEl = document.getElementById('s5-prog-slots');

    /* The eleven buildings and the two birds, built from the list rather
       than written out thirteen times. Each one is an empty transparent
       button: no box, no border, no background. The sticker under it is
       painted into the map and lifts in the shader, and the only thing
       this element ever holds is the seal once the place is finished. */
    const hot = {};
    Object.keys(HOT).forEach(key => {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = 's5-h-' + key;
      b.className = 's5-hot' + (PLACES.indexOf(key) < 0 ? ' is-egg' : '');
      if (PLACES.indexOf(key) >= 0) {
        const seal = document.createElement('i');
        seal.className = 's5-seal' + (MAIN.indexOf(key) < 0 ? ' is-mini' : '');
        b.appendChild(seal);
      }
      s5.appendChild(b);
      hot[key] = b;
    });

    const rand = (a, b) => a + Math.random() * (b - a);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lang5 = (document.documentElement.lang || 'zh').indexOf('en') === 0 ? 'en' : 'zh';
    let active = false;

    /* ---------------- the map's pixels, on this screen ----------------
       On a screen wide enough to take it, the whole sheet: contain, which
       is the smaller of the two ratios rather than the larger, and no pan,
       because there is nowhere to pan to.

       On a phone held upright it cannot be the whole sheet. This map is
       twice as wide as it is tall and a phone is twice as tall as it is
       wide, so fitting it whole leaves a band 390 by 193, in which the
       little bird at the far left is sixteen pixels across and nobody can
       see what they are pressing. There the map is shown at the height of
       the screen instead and dragged sideways, which is what the four
       chapters before this one already do and what anyone does with a
       paper map too big for the table. It comes out three and a half times
       the size.

       One flag, read at every resize, and the rest of the file converts
       fractions of the artwork through whichever transform is in force. */
    let k = 1, ox = 0, oy = 0, W = 0, H = 0, dpr = 1;
    let whole = true, pan = 0;

    function chooseFit() {
      whole = (innerWidth / innerHeight) >= 1.30;
    }
    function panRange() {
      if (whole) return 0;
      const s = (innerWidth / innerHeight) / PANO_A;
      return s >= 1 ? 0 : Math.max(0, 0.5 - s / 2);
    }
    function mapView() {
      if (whole) {
        k  = Math.min(innerWidth / IW, innerHeight / IH);
        ox = innerWidth / 2 - 0.5 * IW * k;
      } else {
        k  = Math.max(innerWidth / IW, innerHeight / IH);
        ox = innerWidth / 2 - (0.5 - pan) * IW * k;
      }
      oy = innerHeight / 2 - 0.5 * IH * k;
    }
    /* The shader works in fractions of the artwork and the brief is written
       in screen pixels, so the two amplitudes are worked out from whatever
       scale the map is being drawn at and pushed again whenever that
       changes. Writing a fraction down once would mean eleven pixels on a
       laptop and twenty six on a phone. */
    function pushScale() {
      if (!window.__set) return;
      const px = IH * k;
      window.__set('lift', HOP_PX / px);
      window.__set('boat', BOAT_PX / px);
    }

    function setPan(v) {
      const m = panRange();
      pan = Math.max(-m, Math.min(m, v));
      if (window.__set) window.__set('pan', pan);
      mapView();
      pushScale();
      placeHots();
      paint(clock, 0);
    }
    function applyFit() {
      chooseFit();
      if (window.__set) window.__set('fit', whole ? 1 : 0);
      setPan(whole ? 0 : pan);
    }
    const SX = fx => ox + fx * IW * k;
    const SY = fy => oy + fy * IH * k;

    function sizeCanvas() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width  = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mapView();
    }

    function placeHots() {
      Object.keys(HOT).forEach(key => {
        const el = hot[key]; if (!el) return;
        const [x0, y0, x1, y1] = HOT[key];
        const w = SX(x1) - SX(x0), h = SY(y1) - SY(y0);
        el.style.left   = SX(x0) + 'px';
        el.style.top    = SY(y0) + 'px';
        el.style.width  = w + 'px';
        el.style.height = h + 'px';
        const seal = el.firstElementChild;
        if (seal) {
          /* The seal is sized off the building it is stamped on, so a
             small house gets a small impression, with a floor under it so
             that two characters are still legible on a phone. */
          const main = MAIN.indexOf(key) >= 0;
          const s = Math.max(main ? 54 : 42,
                             Math.min(main ? 96 : 68, Math.min(w, h) * (main ? 0.46 : 0.34)));
          seal.style.width = seal.style.height = s + 'px';
        }
      });
    }

    /* ---------------- the sticker under the pointer ----------------
       The shader is told the name of the one place being touched and how
       far it has come up, and it does the rest. The rise is eased here
       rather than in the shader so that letting go lowers the sticker
       instead of dropping it. */
    let hotKey = null, hotAmt = 0, hotWant = 0;

    /* Which places are finished, as bits in two numbers rather than one.
       Eleven bits is a value up to 2047, and a fragment shader is only
       promised ten bits of integer when it falls back to medium precision,
       so a single number could quietly lose the eleventh place on a phone.
       Six bits apiece cannot. */
    function pushDone() {
      if (!window.__set) return;
      /* Someone who asked not to be shown movement should not be given
         eleven buildings bouncing at them every three seconds. The bits
         that stop a finished building hopping are exactly the bits that
         stop any building hopping, so reduced motion simply sets all
         eleven. Reaching for one still lifts it, because that is an
         answer to a touch rather than motion for its own sake. */
      if (reduce) {
        window.__set('liftDone', 63);
        window.__set('liftDone2', 31);
        return;
      }
      let a = 0, b = 0;
      PLACES.forEach(key => {
        if (!done[key]) return;
        const n = NO[key];
        if (n <= 6) a += Math.pow(2, n - 1);
        else        b += Math.pow(2, n - 7);
      });
      window.__set('liftDone', a);
      window.__set('liftDone2', b);
    }

    function setHot(key) {
      if (key === hotKey) return;
      /* While one is still settling, the name stays put until it is all
         the way down; swapping it mid fall would snap one sticker back to
         the page and jerk the next one up. */
      if (key) {
        hotKey = key;
        if (window.__set) window.__set('liftHot', PHASE[key]);
      }
      hotWant = key ? 1 : 0;
      wake();
    }

    /* ---------------- what has been found ---------------- */
    const done = Object.create(null);
    let finished = false;

    function countMain() { return MAIN.filter(s => done[s]).length; }
    function countSide() { return SIDE.filter(s => done[s]).length; }

    function paintProgress() {
      const t = T5[lang5];
      progT.textContent = t.prog;
      /* Both tallies on the one line. Two lines that each say three of five
         is one line too many on a slip this size. */
      progEn.textContent = t.tally(countMain(), countSide());
      const all = countMain() === MAIN.length && countSide() === SIDE.length;
      badgeEl.hidden = !all;
      badgeEl.textContent = all ? t.badge : '';
      slotsEl.replaceChildren();
      MAIN.forEach(key => {
        const sp = document.createElement('span');
        sp.className = 's5-slot' + (done[key] ? ' is-on' : '');
        const st = t.st[key];
        /* Earned or not, the slot is the same component: a stamp, or the
           shape of the stamp that is missing. A collector's page shows
           what is not there yet, not only what is. */
        stampInto(sp, st.seal, toneOf(key), { tag: 'slot', empty: !done[key] });
        sp.title = done[key] ? st.seal2 : st.seal;
        slotsEl.appendChild(sp);
      });
    }

    function paintSeals() {
      PLACES.forEach(key => {
        const el = hot[key]; if (!el) return;
        const seal = el.firstElementChild;
        el.classList.toggle('is-done', !!done[key]);
        if (!seal) return;
        if (done[key]) stampInto(seal, T5[lang5].st[key].seal, toneOf(key), { tag: 'map' });
        else seal.replaceChildren();
      });
    }

    /* ---------------- the lights, the fireflies and the rest ----------------
       One canvas, source-over. The earlier chapters blend theirs as screen
       because they are made of light; this one is made of brown ink on
       cream paper, and light added to cream does nothing at all. */
    /* Soft discs, drawn once and then stamped wherever they are needed.
       Building a radial gradient per place per frame is the one thing in a
       loop like this that actually costs anything. */
    function disc(stops) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(st => gd.addColorStop(st[0], st[1]));
      g.fillStyle = gd;
      g.fillRect(0, 0, 128, 128);
      return c;
    }
    const GLOW = disc([[0, 'rgba(246, 198, 104, 1)'], [0.18, 'rgba(238, 176, 66, .80)'],
                       [0.46, 'rgba(226, 158, 52, .20)'], [1, 'rgba(226, 158, 52, 0)']]);
    const SHADE = disc([[0, 'rgba(84, 62, 34, .38)'], [0.45, 'rgba(84, 62, 34, .16)'],
                        [1, 'rgba(84, 62, 34, 0)']]);
    /* The light at the way in. Its own disc rather than the halo's,
       because what is wanted here is a small bright thing with a soft
       edge, and the halo is a soft thing with no bright part at all: drawn
       small it came out as a two pixel speck on cream paper. */
    const SPOT = disc([[0, 'rgba(255, 236, 184, 1)'], [0.26, 'rgba(246, 190, 78, .96)'],
                       [0.48, 'rgba(236, 166, 56, .46)'], [1, 'rgba(232, 158, 50, 0)']]);

    const motes = [];        /* fireflies in the banyan */
    const bits  = [];        /* feathers, leaves, gold dust */

    function lightBanyan() {
      if (motes.length || reduce) return;
      const [x0, y0, x1, y1] = BANYAN;
      for (let i = 0; i < 16; i++) {
        motes.push({
          fx: rand(x0 + 0.012, x1 - 0.012), fy: rand(y0 + 0.055, y1 - 0.030),
          r: rand(1.4, 3.1), p: rand(0, 6.283), sp: rand(0.55, 1.25),
          dx: rand(-0.0016, 0.0016), dy: rand(-0.0012, 0.0012), t: 0,
          max: rand(7.5, 10.5),
        });
      }
      wake();
    }

    /* A feather, a leaf or a speck of gold. One list, because they differ
       only in how they fall and what colour they are. */
    function spawn(kind, fx, fy, n) {
      if (reduce) return;
      for (let i = 0; i < n; i++) {
        bits.push({
          kind, fx: fx + rand(-0.008, 0.008), fy: fy + rand(-0.006, 0.006),
          /* All of these are fractions of the artwork per second. The
             first pass had them divided by a hundred, which left a leaf
             falling at two thirds of an image pixel a second: over its
             whole life it travelled less than its own width. */
          vx: kind === 'dust' ? rand(-0.022, 0.022) : rand(-0.006, 0.006),
          vy: kind === 'dust' ? rand(-0.018, 0.010) : rand(0.016, 0.034),
          rot: rand(0, 6.283), vr: rand(-1.6, 1.6),
          sz: kind === 'dust' ? rand(1.2, 2.8) : rand(6, 12),
          life: 0, max: kind === 'dust' ? rand(1.1, 2.0) : rand(2.6, 4.4),
          sway: rand(0.8, 2.0), ph: rand(0, 6.283),
        });
      }
      wake();
    }

    const LEAF_INK = ['#B9712E', '#C98A3A', '#9E5F2B', '#A8803C'];

    function paint(t, dt) {
      ctx.clearRect(0, 0, W, H);

      /* the fireflies in the banyan. The canopy is painted dark green, so
         warm light laid on it reads; this is the one place on the sheet
         where that is true. */
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.t += dt;
        /* They come up when a place is finished and then settle. Left
           burning they become one more thing moving on a map that is
           meant to be read. */
        if (m.t > m.max) { motes.splice(i, 1); continue; }
        const fade = Math.min(1, m.t / 0.9) * Math.min(1, (m.max - m.t) / 1.8);
        const puls = fade * (0.45 + 0.55 * Math.sin(m.t * m.sp * 2.1 + m.p));
        const x = SX(m.fx + Math.sin(m.t * 0.42 + m.p) * 0.0045 + m.dx * m.t);
        const y = SY(m.fy + Math.cos(m.t * 0.33 + m.p) * 0.0060 + m.dy * m.t);
        const r = Math.max(1, m.r * k * 2.0);
        const gd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
        gd.addColorStop(0, 'rgba(255, 228, 150, ' + (0.80 * puls).toFixed(3) + ')');
        gd.addColorStop(0.45, 'rgba(246, 196, 90, ' + (0.26 * puls).toFixed(3) + ')');
        gd.addColorStop(1, 'rgba(246, 196, 90, 0)');
        ctx.fillStyle = gd;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.4, 0, 6.2832);
        ctx.fill();
      }

      /* ---- the places still to be found ----
         A warm paper edge glow that rises with each sticker as it hops,
         and a small light at the way in. Both ride the sticker's own hop,
         worked out here exactly as the shader works it out, so the light
         and the paper move together rather than arguing. */
      for (let i = 0; i < PLACES.length; i++) {
        const key = PLACES[i];
        if (done[key]) continue;
        const hop = hopAt(key, t);
        const grab = (hotKey === key) ? hotAmt : 0;
        const rise = Math.max(hop * IDLE, grab);

        /* the gold edge round the sticker, brightening as it comes up */
        const b = HOT[key];
        const cx = SX((b[0] + b[2]) / 2), cy = SY((b[1] + b[3]) / 2) - rise * HOP_PX * 0.5;
        const rw = (SX(b[2]) - SX(b[0])) * 0.80, rh = (SY(b[3]) - SY(b[1])) * 0.80;
        ctx.globalAlpha = 0.11 + 0.26 * rise;
        ctx.drawImage(GLOW, cx - rw, cy - rh, rw * 2, rh * 2);

        /* the shadow it leaves on the paper underneath */
        if (rise > 0.02) {
          const sw = (SX(b[2]) - SX(b[0])) * 0.44;
          const sh = Math.max(7, sw * 0.17);
          ctx.globalAlpha = 0.70 * rise;
          ctx.drawImage(SHADE, cx - sw, SY(b[3]) - sh * 0.6, sw * 2, sh * 2);
        }

        /* the light itself, about ten pixels of it, at the way in */
        const d = DOT[key];
        const dx = SX(d[0]), dy = SY(d[1]) - rise * HOP_PX * 0.5;
        const r = MAIN.indexOf(key) >= 0 ? 18 : 13;
        ctx.globalAlpha = 0.60 + 0.40 * (0.35 + 0.65 * hop);
        ctx.drawImage(SPOT, dx - r, dy - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      /* feathers, leaves and gold dust */
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.life += dt;
        if (b.life > b.max) { bits.splice(i, 1); continue; }
        const u = b.life / b.max;
        /* A leaf swings as it falls, which is most of what makes it read
           as a leaf rather than as a falling object. */
        b.fx += b.vx * dt + Math.sin(b.life * b.sway + b.ph) * dt * 0.010;
        b.fy += b.vy * dt;
        if (b.kind === 'dust') b.vy += dt * 0.030;
        b.rot += b.vr * dt;
        const x = SX(b.fx), y = SY(b.fy);
        const a = u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = Math.max(0, a) * (b.kind === 'dust' ? 0.9 : 0.82);
        if (b.kind === 'dust') {
          ctx.fillStyle = '#E8B14A';
          ctx.beginPath();
          ctx.arc(0, 0, b.sz * k * 2.2, 0, 6.2832);
          ctx.fill();
        } else if (b.kind === 'feather') {
          ctx.fillStyle = '#6E9CC4';
          ctx.beginPath();
          ctx.ellipse(0, 0, b.sz * k * 0.7, b.sz * k * 2.0, 0, 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = 'rgba(40, 62, 86, .55)';
          ctx.lineWidth = Math.max(0.6, k * 1.2);
          ctx.beginPath();
          ctx.moveTo(0, -b.sz * k * 2.0);
          ctx.lineTo(0, b.sz * k * 2.0);
          ctx.stroke();
        } else {
          ctx.fillStyle = LEAF_INK[i % LEAF_INK.length];
          ctx.beginPath();
          ctx.ellipse(0, 0, b.sz * k * 1.5, b.sz * k * 0.7, 0, 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = 'rgba(92, 58, 24, .55)';
          ctx.lineWidth = Math.max(0.6, k * 1.1);
          ctx.beginPath();
          ctx.moveTo(-b.sz * k * 1.5, 0);
          ctx.lineTo(b.sz * k * 1.5, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    let raf = 0, t0 = 0, prev = 0, clock = 0;
    function busy() {
      /* The eleven stickers hopping keep the loop alive on their own,
         which is the point of them. */
      return bits.length > 0 || motes.length > 0 || hotAmt !== hotWant ||
             (!reduce && PLACES.some(key => !done[key]));
    }
    function frame(now) {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, t - prev || 0);
      prev = t; clock = t;
      if (hotAmt !== hotWant) {
        const step = dt / (hotWant ? 0.16 : 0.34);   /* up quickly, down gently */
        hotAmt = hotWant > hotAmt ? Math.min(hotWant, hotAmt + step)
                                  : Math.max(hotWant, hotAmt - step);
        if (window.__set) window.__set('liftAmt', hotAmt);
        if (hotAmt === 0 && hotWant === 0) hotKey = null;
      }
      paint(t, dt);
      if (active && busy()) raf = requestAnimationFrame(frame);
      else raf = 0;
    }
    function wake() {
      if (!active || raf) return;
      t0 = performance.now(); prev = 0;
      raf = requestAnimationFrame(frame);
    }
    function stopFX() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    /* ---------------- the hint ---------------- */
    let hintTimer = 0;
    function showHint(msg) {
      hintEl.textContent = msg;
      hintEl.classList.add('is-in');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => hintEl.classList.remove('is-in'), 7000);
    }

    /* ---------------- the cards ----------------
       A main station asks two questions and a side trip asks one. The two
       have to be answered one after the other to earn the seal, which is
       what step is counting; a wrong answer takes that option away and
       leaves you on the same question rather than sending you back to the
       start, because being sent back to the start of a two question round
       is a punishment and this is a map, not an exam. */
    let openKey = null, openKind = null, step = 0;

    function closeCard() {
      setHot(null);
      card.classList.remove('is-in');
      card.setAttribute('aria-hidden', 'true');
      openKey = null; openKind = null;
    }

    function askQuestion(key) {
      const t = T5[lang5], st = t.st[key], qn = st.qs[step];
      quizEl.hidden = false;
      cardS.textContent = st.qs.length > 1 ? t.step(step + 1, st.qs.length) : '';
      cardQ.textContent = qn.q;
      optsEl.replaceChildren();
      qn.o.forEach((label, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 's5-opt';
        b.textContent = label;
        b.addEventListener('click', () => answer(key, i, b));
        optsEl.appendChild(b);
      });
      goEl.hidden = true;
    }

    function openStation(key) {
      setHot(null);
      const t = T5[lang5], st = t.st[key];
      openKey = key; openKind = 'station'; step = 0;
      cardK.textContent = st.k;
      cardT.textContent = st.t;
      cardB.textContent = st.b;
      cardX.setAttribute('aria-label', t.closeAria);
      cardX.firstElementChild.textContent = t.close;
      cardV.textContent = '';

      if (done[key]) {
        /* Already answered. The card is then only the story. */
        quizEl.hidden = true;
        goEl.hidden = false;
        goEl.textContent = t.ok;
      } else {
        askQuestion(key);
      }
      card.classList.add('is-in');
      card.setAttribute('aria-hidden', 'false');
    }

    function openEgg(which) {
      const t = T5[lang5], e = t.egg[which];
      openKey = which; openKind = 'egg';
      cardK.textContent = '';
      cardT.textContent = e.t;
      cardB.textContent = e.b;
      cardV.textContent = '';
      quizEl.hidden = true;
      goEl.hidden = false;
      goEl.textContent = t.ok;
      cardX.firstElementChild.textContent = t.close;
      card.classList.add('is-in');
      card.setAttribute('aria-hidden', 'false');
    }

    function answer(key, i, btn) {
      const t = T5[lang5], st = t.st[key], qn = st.qs[step];
      if (i !== qn.a) {
        btn.classList.add('is-wrong');
        btn.disabled = true;
        cardV.textContent = t.wrong;
        return;
      }
      btn.classList.add('is-right');
      Array.from(optsEl.children).forEach(b => { b.disabled = true; });
      if (step + 1 < st.qs.length) {
        cardV.textContent = t.next;
        step += 1;
        setTimeout(() => {
          if (openKey === key && card.classList.contains('is-in')) {
            askQuestion(key);
            cardV.textContent = '';
          }
        }, 900);
        return;
      }
      cardV.textContent = t.right + ' ' + st.seal2;
      goEl.hidden = false;
      goEl.textContent = MAIN.indexOf(key) >= 0 ? t.take : t.takeSide;
    }

    function award(key) {
      if (done[key]) return;
      done[key] = true;
      pushDone();
      paintSeals();
      paintProgress();
      const [x0, y0, x1, y1] = HOT[key];
      spawn('dust', (x0 + x1) / 2, (y0 + y1) / 2, MAIN.indexOf(key) >= 0 ? 12 : 7);
      if (countMain() >= MAIN.length) finish();
      else if (countMain() + countSide() >= PLACES.length) lightBanyan();
      wake();
    }

    goEl.addEventListener('click', () => {
      const key = openKey, kind = openKind;
      closeCard();
      if (kind === 'station' && key) award(key);
    });
    cardX.addEventListener('click', closeCard);

    /* ---------------- the places ---------------- */
    PLACES.forEach(key => {
      const el = hot[key]; if (!el) return;
      el.addEventListener('click', () => { if (active && !dragged()) openStation(key); });
      /* Reaching a place lifts its sticker off the page. On a touch screen
         this fires as the finger lands, which is right: the paper comes up
         under the finger and goes back down when it leaves. */
      el.addEventListener('pointerenter', () => { if (active) setHot(key); });
      el.addEventListener('pointerleave', () => setHot(null));
      el.addEventListener('focus', () => { if (active) setHot(key); });
      el.addEventListener('blur', () => setHot(null));
    });
    ['birdA', 'birdB'].forEach(key => {
      const el = hot[key]; if (!el) return;
      el.addEventListener('click', () => {
        if (!active || dragged()) return;
        const [x0, y0, x1, y1] = HOT[key];
        spawn('feather', (x0 + x1) / 2, (y0 + y1) / 2, 3);
        openEgg('bird');
      });
    });

    /* ---------------- all five ---------------- */
    function finish() {
      if (finished) return;
      finished = true;
      wake();
      showHint(T5[lang5].allDone);
      for (let i = 0; i < 46; i++) {
        spawn('dust', rand(0.12, 0.88), rand(0.18, 0.80), 1);
      }
      for (let i = 0; i < 9; i++) {
        spawn('leaf', rand(0.15, 0.85), rand(0.12, 0.40), 1);
      }
      lightBanyan();
      setTimeout(() => { if (active) openGallery(); }, reduce ? 400 : 1700);
    }

    /* ====================== the twelve cards ======================
       Everything below draws onto a canvas and then hands over an image.
       The canvas never reaches the page: in Taiwan a great many people
       will open this inside LINE or Instagram, where a link with a
       download attribute is quietly ignored and the only way to keep a
       picture is to press and hold it. You cannot press and hold a
       canvas. You can press and hold an img. */
    const shot = document.getElementById('s5-shot');
    const thumbs = document.getElementById('s5-thumbs');
    const galT = document.getElementById('s5-gal-t');
    const galS = document.getElementById('s5-gal-s');
    const galX = document.getElementById('s5-gal-x');
    const dlEl = document.getElementById('s5-dl');
    const dlNote = document.getElementById('s5-dl-note');
    const prevB = document.getElementById('s5-prev');
    const nextB = document.getElementById('s5-next');

    let pick = 0;

    function load(src) {
      return new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      });
    }

    /* ---------------- what gets handed over ----------------
       The card itself, and whatever layers are listed below drawn over
       it. There are none at the moment: the day calendar that used to sit
       on the writing lines has been taken out along with every piece of
       date arithmetic that fed it, and a postcard now comes out of here
       exactly as it was painted.

       The list is the seam. Give an entry a picture and where to put it,
       as fractions of whichever card it lands on, and it is composited in
       on top; with the list empty the card is handed straight over. */
    const LAYERS = [];

    /* Always through the canvas, even with nothing to draw on top. The
       cards are stored as WebP because twelve of them at postcard
       resolution is three megabytes that way and twice that as JPEG, but
       what leaves here is named .jpg and has to be one: a WebP handed over
       under a JPEG name is a file some phones will refuse to put in a
       photo library and some apps will refuse to send. Ninety four is
       indistinguishable from the stored card and universally openable. */
    function compose(i) {
      return Promise.all([load(CARDS[i])].concat(LAYERS.map(l => load(l.src))))
        .then(ims => {
          const base = ims[0];
          const c = document.createElement('canvas');
          c.width = base.naturalWidth; c.height = base.naturalHeight;
          const x = c.getContext('2d');
          x.drawImage(base, 0, 0);
          LAYERS.forEach((l, n) => {
            const w = l.w * c.width;
            const h = w * ims[n + 1].naturalHeight / ims[n + 1].naturalWidth;
            x.save();
            x.translate(l.x * c.width, l.y * c.height);
            x.rotate((l.tilt || 0) * Math.PI / 180);
            x.globalAlpha = l.alpha === undefined ? 1 : l.alpha;
            x.drawImage(ims[n + 1], -w / 2, -h / 2, w, h);
            x.restore();
          });
          return c.toDataURL('image/jpeg', 0.94);
        });
    }

    let composing = 0;
    function refresh() {
      const mine = ++composing;
      compose(pick).then(url => {
        if (mine !== composing) return;
        shot.src = url;
        dlEl.href = url;
        /* Named for the card rather than for the day, now that there is
           no day on it. */
        dlEl.download = 'mackay-postcard-' + (pick + 1) + '.jpg';
      }).catch(() => {});
    }

    function buildThumbs() {
      thumbs.replaceChildren();
      CARDS.forEach((src, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 's5-thumb';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i === pick ? 'true' : 'false');
        b.setAttribute('aria-label', String(i + 1));
        b.style.backgroundImage = 'url("' + THUMBS[i] + '")';
        b.addEventListener('click', () => { pick = i; markThumbs(); refresh(); });
        thumbs.appendChild(b);
      });
    }
    function markThumbs() {
      Array.from(thumbs.children).forEach((b, i) =>
        b.setAttribute('aria-selected', i === pick ? 'true' : 'false'));
    }
    function step2(d) {
      pick = (pick + d + CARDS.length) % CARDS.length;
      markThumbs(); refresh();
    }

    function labelGallery() {
      const g = T5[lang5].gal;
      galT.textContent = g.t;
      galS.textContent = g.s;
      dlEl.textContent = g.dl;
      dlNote.textContent = g.note;
      prevB.setAttribute('aria-label', g.prev);
      nextB.setAttribute('aria-label', g.next);
      galX.setAttribute('aria-label', T5[lang5].closeAria);
      galX.firstElementChild.textContent = T5[lang5].close;
      shot.alt = g.t;
    }

    function openGallery() {
      labelGallery();
      if (!thumbs.children.length) buildThumbs();
      refresh();
      gal.classList.add('is-in');
      gal.setAttribute('aria-hidden', 'false');
    }
    function closeGallery() {
      gal.classList.remove('is-in');
      gal.setAttribute('aria-hidden', 'true');
    }
    galX.addEventListener('click', closeGallery);
    gal.addEventListener('click', e => { if (e.target === gal) closeGallery(); });
    prevB.addEventListener('click', () => step2(-1));
    nextB.addEventListener('click', () => step2(1));
    addEventListener('keydown', e => {
      if (!gal.classList.contains('is-in')) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowLeft') step2(-1);
      if (e.key === 'ArrowRight') step2(1);
    });

    /* ---------------- seams for the tests ----------------
       Reaching the gallery the honest way means two dozen presses and half
       a minute of transitions. These hand over the same things the page
       itself uses, in the same state, so a check can be a measurement. The
       page already gives out __set and __setTime for exactly this reason. */
    window.__s5open  = () => { if (active) openGallery(); };
    window.__s5pick  = i => { pick = i; markThumbs(); refresh(); };
    window.__s5shot  = () => shot.src;
    window.__s5win   = key => { if (PLACES.indexOf(key) >= 0) award(key); };
    window.__s5state = () => ({
      main: countMain(), side: countSide(), finished: finished,
      whole: whole, pan: +pan.toFixed(4), panRange: +panRange().toFixed(4),
      done: PLACES.filter(s => done[s]),
      motes: motes.length, bits: bits.length,
      stamps: document.querySelectorAll('#s5 .s5-stamp, #s5-prog .s5-stamp').length,
      circles: document.querySelectorAll('#s5 circle, #s5-prog circle').length,
    });
    window.__s5stamp = renderWatercolorStamp;
    window.__s5hop   = hopAt;

    /* ---------------- language ---------------- */
    document.addEventListener('langchange', e => {
      lang5 = e.detail.lang;
      paintProgress();
      paintSeals();
      if (hintEl.classList.contains('is-in'))
        hintEl.textContent = whole ? T5[lang5].hint : T5[lang5].hintDrag;
      if (gal.classList.contains('is-in')) labelGallery();
      if (card.classList.contains('is-in') && openKey) {
        if (openKind === 'station') openStation(openKey);
        else openEgg(openKey);
      }
    });

    /* ---------------- chapter in, chapter out ---------------- */
    addEventListener('resize', () => {
      if (!active) return;
      sizeCanvas();
      applyFit();
    });

    /* ---------------- dragging the map ----------------
       Only ever sideways, and only when the sheet is wider than the screen.
       A drag ends with a click of its own and the gap between the two is
       not bounded, so a press is settled on pointerup behind an eight pixel
       guard rather than on click; without it, dragging the map across the
       chapel opens the chapel. */
    let dragId = -1, dragX = 0, dragPan = 0, moved = 0;
    s5.addEventListener('pointerdown', e => {
      if (!active || whole || panRange() === 0) return;
      dragId = e.pointerId; dragX = e.clientX; dragPan = pan; moved = 0;
    });
    s5.addEventListener('pointermove', e => {
      if (dragId !== e.pointerId) return;
      const dx = e.clientX - dragX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved < 8) return;
      if (!s5.classList.contains('is-drag')) {
        s5.classList.add('is-drag');
        try { s5.setPointerCapture(e.pointerId); } catch (_) {}
      }
      const span = IW * k;
      setPan(dragPan - dx / span);
    });
    function endDrag(e) {
      if (dragId !== e.pointerId) return;
      dragId = -1;
      try { s5.releasePointerCapture(e.pointerId); } catch (_) {}
      /* The class comes off on the next frame, so the click that follows a
         real drag finds it still set and is ignored. */
      if (s5.classList.contains('is-drag')) {
        setTimeout(() => s5.classList.remove('is-drag'), 0);
      }
    }
    s5.addEventListener('pointerup', endDrag);
    s5.addEventListener('pointercancel', endDrag);
    function dragged() { return s5.classList.contains('is-drag'); }

    document.addEventListener('scenechange', e => {
      const on = e.detail.id === 5;
      if (on === active) return;
      active = on;
      if (on) {
        if (window.__setScene) window.__setScene(MAP5, MASK5, PANO_A);
        if (window.__set) {
          for (const key in LOOK) window.__set(key, LOOK[key]);
          window.__set('pan', 0);
        }
        sizeCanvas();
        applyFit();
        pushDone();
        paintSeals();
        paintProgress();
        s5.classList.add('is-in');
        progEl.classList.add('is-in');
        progEl.setAttribute('aria-hidden', 'false');
        showHint(whole ? T5[lang5].hint : T5[lang5].hintDrag);
        paint(0, 0);
        wake();
      } else {
        s5.classList.remove('is-in');
        progEl.classList.remove('is-in');
        progEl.setAttribute('aria-hidden', 'true');
        hintEl.classList.remove('is-in');
        setHot(null);
        hotAmt = 0;
        if (window.__set) window.__set('liftAmt', 0);
        closeCard();
        closeGallery();
        stopFX();
        /* The uniforms are deliberately not cleared here. Every chapter
           states its whole look on the way in and its enter runs before
           this exit, so clearing anything would undo what the chapter
           arriving had just set. That mistake cost chapter three its wind
           once already. */
      }
    });
  })();
