/* 霧、雨和雪是怎樣形成的？ 互動課件 */
(function () {
  "use strict";

  var TEXT = {
    evaporate: "海水受熱，蒸發成水蒸氣。",
    fog: "當有明顯的降溫，接近地面的水蒸氣遇冷凝結",
    cloud: "在高空時，水蒸氣遇冷凝結成小水滴，小水滴聚集成雲。",
    heavy: "雲中的小水滴積聚，變得愈來愈重",
    iceUp: "雲中的小水滴上升，遇冷凝結成冰晶",
    iceFall: "冰晶聚集，因重力而下降",
    airWarm: "冰晶下降時，當空氣中的溫度高於 0℃",
    airCold: "冰晶下降時，當空氣中的溫度是 0℃ 或低於 0℃",
    groundWarm: "接近地面時，如果溫度高於 0℃，由降雪變成降雨。"
  };

  var CHIPS = [
    { id: "evaporated", label: "海水蒸發" },
    { id: "fog", label: "近地面成霧" },
    { id: "cloud", label: "高空成雲" },
    { id: "dropRain", label: "小水滴積聚降雨" },
    { id: "icePath", label: "冰晶與溫度" }
  ];

  var flags = blankFlags();
  var step = "start";
  var history = [];
  var mode = "observe"; // observe | overview | quiz
  var quizLevel = "support";
  var quizIndex = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizOrder = [];
  var quizPicked = [];
  var quizMulti = [];

  var $ = function (id) { return document.getElementById(id); };

  function blankFlags() {
    return {
      evaporated: false,
      fog: false,
      cloud: false,
      dropRain: false,
      iceFormed: false,
      iceRain: false,
      iceSnow: false,
      snowToRain: false,
      snowStay: false
    };
  }

  function icePathDone() {
    return flags.iceFormed && (flags.iceRain || flags.iceSnow);
  }
  function bothMainPathsDone() {
    return flags.fog && flags.cloud && flags.dropRain && icePathDone();
  }
  function doneCount() {
    var n = 0;
    if (flags.evaporated) n++;
    if (flags.fog) n++;
    if (flags.cloud) n++;
    if (flags.dropRain) n++;
    if (icePathDone()) n++;
    return n;
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (k) {
      el.setAttribute(k, attrs[k]);
    });
    return el;
  }

  function buildParticles() {
    var steam = $("steamLayer");
    steam.innerHTML = "";
    var steamPos = [
      [90, 430, "wisp wisp-lingering wisp-high", 0],
      [120, 438, "wisp wisp-lingering wisp-high", 0.5],
      [150, 426, "wisp wisp-lingering wisp-high", 1.1],
      [180, 434, "wisp wisp-lingering", 0.3],
      [105, 442, "wisp wisp-near", 0.2],
      [145, 444, "wisp wisp-near", 0.9],
      [200, 436, "wisp wisp-near", 1.4],
      [70, 440, "wisp wisp-high", 1.6],
      [160, 420, "wisp wisp-high", 0.7]
    ];
    steamPos.forEach(function (p) {
      var outer = svgEl("g", { transform: "translate(" + p[0] + " " + p[1] + ")" });
      var g = svgEl("g", {
        class: p[2],
        style: "animation-delay:-" + p[3] + "s"
      });
      var path = svgEl("path", {
        d: "M0,0 c4,-10 3,-16 0,-26 c-4,-10 2,-16 3,-28",
        fill: "none",
        stroke: "#e8f6ff",
        "stroke-width": "5",
        "stroke-linecap": "round",
        opacity: "0.85"
      });
      var path2 = svgEl("path", {
        d: "M8,-6 c3,-9 1,-15 -1,-24",
        fill: "none",
        stroke: "#cfe8f8",
        "stroke-width": "3.2",
        "stroke-linecap": "round",
        opacity: "0.7"
      });
      g.appendChild(path);
      g.appendChild(path2);
      outer.appendChild(g);
      steam.appendChild(outer);
    });

    var drops = $("cloudDrops");
    drops.innerHTML = "";
    var dropPos = [
      [560, 148], [590, 140], [620, 152], [650, 144],
      [580, 160], [640, 158], [605, 132], [670, 150]
    ];
    dropPos.forEach(function (p, i) {
      var c = svgEl("circle", {
        class: "cloud-drop",
        cx: String(p[0]),
        cy: String(p[1]),
        r: i % 3 === 0 ? "5" : "4",
        fill: "#5eb0e0"
      });
      drops.appendChild(c);
    });

    var crystals = $("crystalLayer");
    crystals.innerHTML = "";
    var cryPos = [
      [560, 70, "crystal"],
      [595, 52, "crystal"],
      [630, 66, "crystal"],
      [665, 48, "crystal"],
      [600, 88, "crystal crystal-fall"],
      [640, 96, "crystal crystal-fall"],
      [670, 80, "crystal crystal-fall"],
      [705, 90, "crystal crystal-fall"]
    ];
    cryPos.forEach(function (p, i) {
      var outer = svgEl("g", { transform: "translate(" + p[0] + " " + p[1] + ")" });
      var g = svgEl("g", {
        class: p[2],
        style: "animation-delay:-" + (i * 0.25) + "s"
      });
      ["0", "60", "120"].forEach(function (deg) {
        g.appendChild(svgEl("line", {
          x1: "0", y1: "-9", x2: "0", y2: "9",
          stroke: "#eef8ff", "stroke-width": "2.2", "stroke-linecap": "round",
          transform: "rotate(" + deg + ")"
        }));
      });
      g.appendChild(svgEl("circle", { r: "2.2", fill: "#fff" }));
      outer.appendChild(g);
      crystals.appendChild(outer);
    });

    function teardropInner(delay) {
      var inner = svgEl("g", {
        class: "drop",
        style: "animation-delay:-" + delay + "s"
      });
      inner.appendChild(svgEl("path", {
        d: "M0,-12 C5.2,-3 5.6,7 0,10 C-5.6,7 -5.2,-3 0,-12Z",
        fill: "#2b8fd4",
        stroke: "#1369a8",
        "stroke-width": "0.6"
      }));
      return inner;
    }
    function flakeInner(delay) {
      var inner = svgEl("g", {
        class: "flake",
        style: "animation-delay:-" + delay + "s"
      });
      ["0", "60", "120"].forEach(function (deg) {
        inner.appendChild(svgEl("line", {
          x1: "0", y1: "-9", x2: "0", y2: "9",
          stroke: "#ffffff", "stroke-width": "2.2", "stroke-linecap": "round",
          transform: "rotate(" + deg + ")"
        }));
      });
      inner.appendChild(svgEl("circle", { r: "2.2", fill: "#fff" }));
      return inner;
    }

    function fillRain(host, xs, y0) {
      host.innerHTML = "";
      xs.forEach(function (x, i) {
        var outer = svgEl("g", { transform: "translate(" + x + " " + y0 + ")" });
        outer.appendChild(teardropInner((i * 0.22) % 1.5));
        host.appendChild(outer);
      });
    }
    function fillSnow(host, xs, y0) {
      host.innerHTML = "";
      xs.forEach(function (x, i) {
        var outer = svgEl("g", { transform: "translate(" + x + " " + y0 + ")" });
        outer.appendChild(flakeInner((i * 0.24) % 1.8));
        host.appendChild(outer);
      });
    }

    var rainAxs = [470, 490, 508, 525, 545, 562, 580, 598, 616, 500, 536, 572];
    var rainBxs = [580, 600, 618, 638, 655, 672, 690, 708, 725, 610, 648, 686];
    var snowXs = [720, 738, 756, 774, 792, 810, 828, 846, 748, 786, 824, 760];
    var mixSnowXs = [730, 748, 766, 784, 802, 820, 838, 856, 758, 796];
    var mixRainXs = [736, 754, 772, 790, 808, 826, 844, 762, 800, 838];

    fillRain($("rainA"), rainAxs, 175);
    fillRain($("rainB"), rainBxs, 200);
    fillSnow($("snowFull"), snowXs, 175);
    fillSnow($("mixSnow"), mixSnowXs, 160);
    fillRain($("mixRain"), mixRainXs, 305);
  }

  /* ---------- 觀察過程狀態 ---------- */
  function enter(next, push) {
    if (push !== false && next !== step) history.push(step);
    step = next;
    if (step === "evaporate") flags.evaporated = true;
    if (step === "ng_fog") flags.fog = true;
    if (step === "hs_cloud") flags.cloud = true;
    if (step === "drop_rain") flags.dropRain = true;
    if (step === "ice_fall") flags.iceFormed = true;
    if (step === "ice_rain") flags.iceRain = true;
    if (step === "ice_snow") flags.iceSnow = true;
    if (step === "snow_to_rain") flags.snowToRain = true;
    if (step === "snow_stay") flags.snowStay = true;
    renderObserve();
  }

  function goPrev() {
    if (!history.length) return;
    step = history.pop();
    renderObserve();
  }

  function restartObserve() {
    flags = blankFlags();
    step = "start";
    history = [];
    hideOverview();
    renderObserve();
  }

  function nextLinear() {
    var map = {
      start: "evaporate",
      evaporate: "path_pick",
      ng_cool: "ng_fog",
      hs_cloud: "cloud_pick",
      ice_up: "ice_fall",
      ice_fall: "air_temp_pick",
      ice_snow: "ground_temp_pick"
    };
    if (map[step]) enter(map[step]);
    else if (isBranchEnd(step)) enter(returnTarget(step));
  }

  function isBranchEnd(s) {
    return s === "ng_fog" || s === "drop_rain" || s === "ice_rain" ||
      s === "snow_to_rain" || s === "snow_stay";
  }
  function returnTarget(s) {
    if (s === "ng_fog") return "path_pick";
    return "cloud_pick";
  }

  function sceneClasses() {
    var cls = [];
    if (flags.evaporated || step === "evaporate") cls.push("has-steam");
    if (flags.fog || step === "ng_fog") cls.push("has-fog");
    if (flags.cloud || step === "hs_cloud" || isHighStep(step)) cls.push("has-cloud");
    return cls.join(" ");
  }
  function isHighStep(s) {
    return [
      "hs_cloud", "cloud_pick", "drop_rain", "ice_up", "ice_fall",
      "air_temp_pick", "ice_rain", "ice_snow", "ground_temp_pick",
      "snow_to_rain", "snow_stay"
    ].indexOf(s) !== -1;
  }

  function captionFor(s) {
    switch (s) {
      case "start":
        return { where: "", text: "按「下一步」，開始觀察海水受熱以後會發生什麼。" };
      case "evaporate":
        return { where: "", text: TEXT.evaporate };
      case "path_pick":
        return { where: "", text: "水蒸氣接下來會怎樣？請選一條路徑觀察：近地面，或高空。" };
      case "ng_cool":
        return { where: "近地面", text: TEXT.fog };
      case "ng_fog":
        return { where: "近地面", text: TEXT.fog };
      case "hs_cloud":
        return { where: "高空", text: TEXT.cloud };
      case "cloud_pick":
        return { where: "高空", text: "雲已經形成。請再選一條路徑，看看雲中的小水滴接下來會怎樣。" };
      case "drop_rain":
        return { where: "高空", text: TEXT.heavy };
      case "ice_up":
        return { where: "高空", text: TEXT.iceUp };
      case "ice_fall":
        return { where: "高空", text: TEXT.iceFall };
      case "air_temp_pick":
        return { where: "高空", text: "冰晶正在下降。請選擇空氣中的溫度，看看會發生什麼。" };
      case "ice_rain":
        return { where: "高空", text: TEXT.airWarm };
      case "ice_snow":
        return { where: "高空", text: TEXT.airCold };
      case "ground_temp_pick":
        return { where: "接近地面", text: "雪正在下降。請選擇接近地面時的溫度，看看會發生什麼。" };
      case "snow_to_rain":
        return { where: "接近地面", text: TEXT.groundWarm };
      case "snow_stay":
        return { where: "接近地面", text: TEXT.airCold };
      default:
        return { where: "", text: "" };
    }
  }

  function choicesFor(s) {
    if (s === "path_pick") {
      return [
        { id: "btnPathNear", label: flags.fog ? "✅ 近地面" : "近地面", className: "btn btn-pink", go: "ng_cool" },
        { id: "btnPathHigh", label: flags.cloud ? "✅ 高空" : "高空", className: "btn btn-blue", go: "hs_cloud" }
      ];
    }
    if (s === "cloud_pick") {
      return [
        { id: "btnDropHeavy", label: flags.dropRain ? "✅ 小水滴積聚，變得愈來愈重" : "小水滴積聚，變得愈來愈重", className: "btn btn-blue", go: "drop_rain" },
        { id: "btnDropIce", label: icePathDone() ? "✅ 小水滴上升，遇冷凝結成冰晶" : "小水滴上升，遇冷凝結成冰晶", className: "btn btn-purple", go: "ice_up" }
      ];
    }
    if (s === "air_temp_pick") {
      return [
        { id: "btnAirWarm", label: "高於 0℃", className: "btn btn-yellow", go: "ice_rain" },
        { id: "btnAirCold", label: "0℃ 或低於 0℃", className: "btn btn-blue", go: "ice_snow" }
      ];
    }
    if (s === "ground_temp_pick") {
      return [
        { id: "btnGroundWarm", label: "高於 0℃", className: "btn btn-yellow", go: "snow_to_rain" },
        { id: "btnGroundCold", label: "0℃ 或低於 0℃", className: "btn btn-blue", go: "snow_stay" }
      ];
    }
    if (s === "ice_rain") {
      var arr = [{ id: "btnTryAirCold", label: "試試 0℃ 或低於 0℃", className: "btn btn-blue", go: "ice_snow" }];
      if (flags.dropRain) arr.push({ id: "btnBackCloud", label: "返回選擇雲中路徑", className: "btn btn-ghost", go: "cloud_pick" });
      else arr.push({ id: "btnBackCloud2", label: "返回選擇雲中路徑", className: "btn btn-ghost", go: "cloud_pick" });
      return arr;
    }
    if (s === "ng_fog") {
      return [{ id: "btnBackPath", label: "返回選擇路徑", className: "btn btn-ghost", go: "path_pick" }];
    }
    if (s === "drop_rain") {
      return [{ id: "btnBackCloud3", label: "返回選擇雲中路徑", className: "btn btn-ghost", go: "cloud_pick" }];
    }
    if (s === "snow_to_rain" || s === "snow_stay") {
      var list = [];
      if (s === "snow_to_rain") list.push({ id: "btnTryGroundCold", label: "試試接近地面 0℃ 或低於 0℃", className: "btn btn-blue", go: "snow_stay" });
      if (s === "snow_stay") list.push({ id: "btnTryGroundWarm", label: "試試接近地面高於 0℃", className: "btn btn-yellow", go: "snow_to_rain" });
      list.push({ id: "btnBackCloud4", label: "返回選擇雲中路徑", className: "btn btn-ghost", go: "cloud_pick" });
      return list;
    }
    return [];
  }

  function nextLabel(s) {
    if (s === "path_pick" || s === "cloud_pick" || s === "air_temp_pick" || s === "ground_temp_pick") return "下一步";
    if (isBranchEnd(s)) return "繼續探索";
    return "下一步";
  }

  function canNext(s) {
    if (s === "path_pick" || s === "cloud_pick" || s === "air_temp_pick" || s === "ground_temp_pick") return false;
    return true;
  }

  function renderProgress() {
    var n = doneCount();
    $("progressLabel").textContent = "進度：已完成 " + n + "／5 項觀察";
    var box = $("progressChips");
    box.innerHTML = "";
    var nowId = null;
    if (step === "evaporate") nowId = "evaporated";
    else if (step === "ng_cool" || step === "ng_fog" || (step === "path_pick" && !flags.fog)) nowId = "fog";
    else if (step === "hs_cloud" || (step === "path_pick" && flags.fog && !flags.cloud)) nowId = "cloud";
    else if (step === "cloud_pick" || step === "drop_rain") nowId = flags.dropRain && step === "cloud_pick" ? "icePath" : (step === "drop_rain" || (step === "cloud_pick" && !flags.dropRain) ? "dropRain" : "icePath");
    else if (isHighStep(step)) nowId = (step === "drop_rain") ? "dropRain" : "icePath";

    var flagMap = {
      evaporated: flags.evaporated,
      fog: flags.fog,
      cloud: flags.cloud,
      dropRain: flags.dropRain,
      icePath: icePathDone()
    };
    CHIPS.forEach(function (c) {
      var el = document.createElement("span");
      el.className = "chip" + (flagMap[c.id] ? " done" : "") + (nowId === c.id && !flagMap[c.id] ? " now" : "");
      el.textContent = (flagMap[c.id] ? "✅ " : "⬜ ") + c.label;
      box.appendChild(el);
    });
  }

  function renderObserve() {
    var scene = $("scene");
    scene.setAttribute("data-step", step);
    scene.setAttribute("class", sceneClasses());
    document.body.setAttribute("data-step", step);

    var cap = captionFor(step);
    var where = $("captionWhere");
    if (cap.where) {
      where.textContent = cap.where;
      where.classList.remove("hidden");
    } else {
      where.textContent = "";
      where.classList.add("hidden");
    }
    $("captionText").textContent = cap.text;

    var box = $("choiceBox");
    var choices = choicesFor(step);
    box.innerHTML = "";
    if (choices.length) {
      box.classList.remove("hidden");
      choices.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.id = c.id;
        b.className = c.className;
        b.textContent = c.label;
        b.addEventListener("click", function () { enter(c.go); });
        box.appendChild(b);
      });
    } else {
      box.classList.add("hidden");
    }

    $("btnPrev").disabled = history.length === 0;
    $("btnNext").disabled = !canNext(step);
    $("btnNext").textContent = nextLabel(step);

    var ov = $("btnOverview");
    if (bothMainPathsDone()) {
      ov.disabled = false;
      ov.textContent = "全部過程";
    } else {
      ov.disabled = true;
      ov.textContent = "全部過程（尚未探索完）";
    }
    renderProgress();
  }

  function showOverview() {
    if (!bothMainPathsDone()) return;
    mode = "overview";
    $("observeMain").classList.add("hidden");
    $("overviewPanel").classList.remove("hidden");
    $("overviewFlow").innerHTML =
      '<div class="flow-block evap"><p>' + TEXT.evaporate + "</p></div>" +
      '<div class="flow-block near"><div class="flow-k">近地面</div><p>' + TEXT.fog + ' <span class="badge badge-fog">霧</span></p></div>' +
      '<div class="flow-block high"><div class="flow-k">高空</div><p>' + TEXT.cloud + "</p>" +
      '<div class="branch"><p>' + TEXT.heavy + ' <span class="badge badge-rain">降雨</span></p></div>' +
      '<div class="branch"><p>' + TEXT.iceUp + "</p><p>" + TEXT.iceFall + "</p>" +
      "<p>" + TEXT.airWarm + ' <span class="badge badge-rain">降雨</span></p>' +
      "<p>" + TEXT.airCold + ' <span class="badge badge-snow">降雪</span></p>' +
      "<p>" + TEXT.groundWarm + "</p></div></div>";
  }
  function hideOverview() {
    mode = "observe";
    $("overviewPanel").classList.add("hidden");
    $("observeMain").classList.remove("hidden");
  }

  /* ---------- 短練習 ---------- */
  var QUIZ = {
    support: [
      { type: "tf", q: "霧是在高空形成的。", answer: false, hint: "看看近地面的路徑：當有明顯的降溫，接近地面的水蒸氣遇冷凝結。" },
      { type: "tf", q: "海水受熱，蒸發成水蒸氣。", answer: true, hint: "觀察海水受熱的步驟。" },
      { type: "tf", q: "在高空時，水蒸氣遇冷凝結成小水滴，小水滴聚集成雲。", answer: true, hint: "這是高空成雲的過程。" }
    ],
    basic: [
      { type: "choice", q: "冰晶下降時，當空氣中的溫度高於 0℃，會出現什麼？", options: ["降雨", "降雪", "霧"], answer: 0, hint: "冰晶下降時，當空氣中的溫度高於 0℃，標籤是「降雨」。" },
      { type: "choice", q: "冰晶下降時，當空氣中的溫度是 0℃ 或低於 0℃，會出現什麼？", options: ["降雨", "降雪", "霧"], answer: 1, hint: "冰晶下降時，當空氣中的溫度是 0℃ 或低於 0℃，標籤是「降雪」。" },
      { type: "choice", q: "接近地面時，如果溫度高於 0℃，降雪會怎樣？", options: ["由降雪變成降雨", "變成霧", "小水滴聚集成雲"], answer: 0, hint: "接近地面時，如果溫度高於 0℃，由降雪變成降雨。" },
      { type: "tf", q: "當有明顯的降溫，接近地面的水蒸氣遇冷凝結，會出現霧。", answer: true, hint: "這是近地面的路徑。" },
      { type: "tf", q: "小水滴聚集成雲，是在接近地面發生的。", answer: false, hint: "在高空時，水蒸氣遇冷凝結成小水滴，小水滴聚集成雲。" }
    ],
    challenge: [
      {
        type: "order",
        q: "請把「雲中的小水滴積聚，變得愈來愈重」這條降雨路徑的步驟，按先後順序排好。",
        items: [
          "海水受熱，蒸發成水蒸氣。",
          "在高空時，水蒸氣遇冷凝結成小水滴，小水滴聚集成雲。",
          "雲中的小水滴積聚，變得愈來愈重"
        ],
        hint: "先有水蒸氣，再到高空成雲，然後小水滴積聚，變得愈來愈重。"
      },
      {
        type: "order",
        q: "請把形成降雪的步驟，按先後順序排好。",
        items: [
          "在高空時，水蒸氣遇冷凝結成小水滴，小水滴聚集成雲。",
          "雲中的小水滴上升，遇冷凝結成冰晶",
          "冰晶聚集，因重力而下降",
          "冰晶下降時，當空氣中的溫度是 0℃ 或低於 0℃"
        ],
        hint: "先成雲，然後小水滴上升成冰晶，冰晶聚集後因重力下降，再看空氣中的溫度。"
      },
      {
        type: "multi",
        q: "降雨可以由哪兩條路徑形成？請選出兩項。",
        options: [
          "雲中的小水滴積聚，變得愈來愈重",
          "冰晶下降時，當空氣中的溫度高於 0℃",
          "冰晶下降時，當空氣中的溫度是 0℃ 或低於 0℃",
          "當有明顯的降溫，接近地面的水蒸氣遇冷凝結"
        ],
        answer: [0, 1],
        hint: "一條是雲中的小水滴積聚，變得愈來愈重；另一條是冰晶下降時，當空氣中的溫度高於 0℃。"
      },
      {
        type: "choice",
        q: "「當有明顯的降溫，接近地面的水蒸氣遇冷凝結」這條路徑，會出現什麼？",
        options: ["霧", "降雨", "降雪"],
        answer: 0,
        hint: "這是近地面的路徑，標籤是「霧」。"
      }
    ]
  };

  var LEVEL_NOTE = {
    support: "這層是判斷對錯，題目較少。答錯可以看提示，也可以再試。",
    basic: "這層混合判斷對錯，以及根據溫度判斷是降雨還是降雪。",
    challenge: "這層要替步驟排序，還要分辨兩條降雨路徑。"
  };

  function quizList() { return QUIZ[quizLevel]; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startLevel(lv) {
    quizLevel = lv;
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    quizOrder = [];
    quizPicked = [];
    quizMulti = [];
    document.querySelectorAll(".lv").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-l") === lv);
    });
    $("levelNote").textContent = LEVEL_NOTE[lv];
    renderQuiz();
  }

  function currentQ() { return quizList()[quizIndex]; }

  function renderQuiz() {
    var box = $("quizBox");
    var list = quizList();
    if (quizIndex >= list.length) {
      box.innerHTML = '<div class="quiz-end"><p>本層完成：答對 ' + quizScore + "／" + list.length + " 題。</p>" +
        '<div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-primary" id="btnRetryLevel">再做一次本層</button></div></div>';
      $("btnRetryLevel").addEventListener("click", function () { startLevel(quizLevel); });
      return;
    }
    var q = currentQ();
    var h = '<p class="qmeta">' + labelOf(quizLevel) + "　第 " + (quizIndex + 1) + "／" + list.length + " 題</p>";
    h += '<p class="qtext" id="qtext">' + escapeHtml(q.q) + "</p>";
    if (q.type === "tf") {
      h += '<div class="opts">' +
        '<button type="button" class="btn opt" data-v="true" id="optTrue">對</button>' +
        '<button type="button" class="btn opt" data-v="false" id="optFalse">錯</button></div>';
    } else if (q.type === "choice") {
      h += '<div class="opts" id="optList">';
      q.options.forEach(function (opt, i) {
        h += '<button type="button" class="btn opt" data-i="' + i + '">' + escapeHtml(opt) + "</button>";
      });
      h += "</div>";
    } else if (q.type === "multi") {
      h += '<div class="opts" id="optList">';
      q.options.forEach(function (opt, i) {
        h += '<button type="button" class="btn opt" data-i="' + i + '">' + escapeHtml(opt) + "</button>";
      });
      h += '</div><div class="btn-row"><button type="button" class="btn btn-primary" id="btnSubmitQ">提交答案</button></div>';
    } else if (q.type === "order") {
      if (!quizOrder.length) quizOrder = shuffle(q.items.map(function (t, i) { return { t: t, i: i }; }));
      h += '<div class="order-picked" id="orderPicked" aria-label="已排順序"></div>';
      h += '<div class="opts" id="orderBank"></div>';
      h += '<div class="btn-row"><button type="button" class="btn btn-ghost" id="btnUndoOrder">取消上一個</button>' +
        '<button type="button" class="btn btn-primary" id="btnSubmitQ">提交順序</button></div>';
    }
    h += '<div class="feedback hidden" id="qFeedback" role="status" aria-live="polite"></div>';
    h += '<div class="btn-row hidden" id="qNextRow"><button type="button" class="btn btn-primary" id="btnNextQ">下一題</button></div>';
    box.innerHTML = h;
    quizAnswered = false;
    quizPicked = [];
    quizMulti = [];
    bindQuiz();
  }

  function labelOf(lv) {
    return { support: "🌱 支援", basic: "⭐ 基本", challenge: "🔥 挑戰" }[lv];
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function bindQuiz() {
    var q = currentQ();
    if (q.type === "tf") {
      $("optTrue").addEventListener("click", function () { submitTf(true); });
      $("optFalse").addEventListener("click", function () { submitTf(false); });
    } else if (q.type === "choice") {
      $("optList").querySelectorAll(".opt").forEach(function (b) {
        b.addEventListener("click", function () { submitChoice(Number(b.getAttribute("data-i"))); });
      });
    } else if (q.type === "multi") {
      $("optList").querySelectorAll(".opt").forEach(function (b) {
        b.addEventListener("click", function () {
          if (quizAnswered) return;
          var i = Number(b.getAttribute("data-i"));
          var k = quizMulti.indexOf(i);
          if (k >= 0) quizMulti.splice(k, 1);
          else quizMulti.push(i);
          b.classList.toggle("on", quizMulti.indexOf(i) >= 0);
        });
      });
      $("btnSubmitQ").addEventListener("click", submitMulti);
    } else if (q.type === "order") {
      paintOrder();
      $("btnUndoOrder").addEventListener("click", function () {
        if (quizAnswered || !quizPicked.length) return;
        quizPicked.pop();
        paintOrder();
      });
      $("btnSubmitQ").addEventListener("click", submitOrder);
    }
  }

  function paintOrder() {
    var q = currentQ();
    var pickedBox = $("orderPicked");
    var bank = $("orderBank");
    if (!quizPicked.length) pickedBox.innerHTML = '<p style="margin:4px 8px;color:#92400e;font-weight:700">請按先後順序點選步驟。</p>';
    else {
      pickedBox.innerHTML = quizPicked.map(function (item, n) {
        return '<div class="slot"><span class="n">' + (n + 1) + "</span><span>" + escapeHtml(item.t) + "</span></div>";
      }).join("");
    }
    bank.innerHTML = "";
    quizOrder.forEach(function (item) {
      var used = quizPicked.some(function (p) { return p.i === item.i; });
      if (used) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn opt";
      b.textContent = item.t;
      b.addEventListener("click", function () {
        if (quizAnswered) return;
        quizPicked.push(item);
        paintOrder();
      });
      bank.appendChild(b);
    });
  }

  function showFb(ok, msg) {
    var fb = $("qFeedback");
    fb.className = "feedback " + (ok ? "ok" : "warn");
    fb.textContent = msg;
    fb.classList.remove("hidden");
  }
  function lockAndNext() {
    $("qNextRow").classList.remove("hidden");
    $("btnNextQ").addEventListener("click", function () {
      quizIndex += 1;
      quizOrder = [];
      quizPicked = [];
      renderQuiz();
    });
  }
  function wrongWithHint(q) {
    showFb(false, "尚未正確。" + (q.hint ? "提示：" + q.hint : ""));
    var row = $("qNextRow");
    row.classList.remove("hidden");
    row.innerHTML = '<button type="button" class="btn btn-yellow" id="btnRetryQ">再試</button>' +
      '<button type="button" class="btn btn-ghost" id="btnSkipHint">先看下一題</button>';
    $("btnRetryQ").addEventListener("click", function () {
      quizAnswered = false;
      quizPicked = [];
      quizMulti = [];
      quizOrder = [];
      renderQuiz();
    });
    $("btnSkipHint").addEventListener("click", function () {
      quizIndex += 1;
      quizOrder = [];
      renderQuiz();
    });
  }

  function submitTf(val) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = currentQ();
    var ok = val === q.answer;
    function mark(el, cls) { if (cls) el.classList.add(cls); }
    mark($("optTrue"), q.answer === true ? "ok" : (val === true ? "bad" : ""));
    mark($("optFalse"), q.answer === false ? "ok" : (val === false ? "bad" : ""));
    if (ok) { quizScore += 1; showFb(true, "正確！"); lockAndNext(); }
    else wrongWithHint(q);
  }
  function submitChoice(i) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = currentQ();
    var ok = i === q.answer;
    $("optList").querySelectorAll(".opt").forEach(function (b) {
      var bi = Number(b.getAttribute("data-i"));
      if (bi === q.answer) b.classList.add("ok");
      else if (bi === i) b.classList.add("bad");
    });
    if (ok) { quizScore += 1; showFb(true, "正確！"); lockAndNext(); }
    else wrongWithHint(q);
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var as = a.slice().sort(), bs = b.slice().sort();
    return as.every(function (v, i) { return v === bs[i]; });
  }
  function submitMulti() {
    if (quizAnswered) return;
    var q = currentQ();
    if (quizMulti.length !== q.answer.length) {
      showFb(false, "請選出 " + q.answer.length + " 項。");
      return;
    }
    quizAnswered = true;
    var ok = sameSet(quizMulti, q.answer);
    $("optList").querySelectorAll(".opt").forEach(function (b) {
      var bi = Number(b.getAttribute("data-i"));
      if (q.answer.indexOf(bi) >= 0) b.classList.add("ok");
      else if (quizMulti.indexOf(bi) >= 0) b.classList.add("bad");
    });
    if (ok) { quizScore += 1; showFb(true, "正確！降雨可以由這兩條路徑形成。"); lockAndNext(); }
    else wrongWithHint(q);
  }
  function submitOrder() {
    if (quizAnswered) return;
    var q = currentQ();
    if (quizPicked.length !== q.items.length) {
      showFb(false, "請把所有步驟都排好，再提交。");
      return;
    }
    quizAnswered = true;
    var ok = quizPicked.every(function (item, i) { return item.i === i; });
    if (ok) { quizScore += 1; showFb(true, "正確！順序對了。"); lockAndNext(); }
    else wrongWithHint(q);
  }

  /* ---------- 分頁 ---------- */
  function showObserve() {
    mode = "observe";
    $("panelObserve").hidden = false;
    $("panelQuiz").hidden = true;
    $("tabObserve").setAttribute("aria-selected", "true");
    $("tabQuiz").setAttribute("aria-selected", "false");
  }
  function showQuiz() {
    mode = "quiz";
    $("panelObserve").hidden = true;
    $("panelQuiz").hidden = false;
    $("tabObserve").setAttribute("aria-selected", "false");
    $("tabQuiz").setAttribute("aria-selected", "true");
    if (!$("quizBox").dataset.ready) {
      $("quizBox").dataset.ready = "1";
      startLevel(quizLevel);
    }
  }

  /* ---------- 自測 ---------- */
  function assert(list, cond, msg) {
    list.push({ ok: !!cond, msg: msg });
    if (cond) console.log("OK", msg);
    else console.error("FAIL", msg);
  }

  function runAutotest() {
    var r = [];
    restartObserve();
    assert(r, step === "start", "起始步驟是 start");
    assert(r, $("captionText").textContent.indexOf("海水受熱，蒸發成水蒸氣") === -1, "開始畫面不顯示蒸發結論");
    assert(r, $("scene").getAttribute("data-step") === "start", "開始畫面 data-step=start");
    assert(r, $("btnOverview").disabled, "未探索完時全部過程鎖定");

    $("btnNext").click();
    assert(r, step === "evaporate", "下一步到蒸發");
    assert(r, $("captionText").textContent === TEXT.evaporate, "蒸發說明為課本原文");
    assert(r, flags.evaporated, "已記海水蒸發");

    $("btnNext").click();
    assert(r, step === "path_pick", "接著選擇路徑");
    $("btnPathNear").click();
    assert(r, step === "ng_cool", "進入近地面降溫");
    assert(r, $("captionText").textContent === TEXT.fog, "近地面說明為課本原文，沒有「形成霧」四字");
    assert(r, $("captionText").textContent.indexOf("形成霧") === -1, "近地面說明不含「形成霧」");
    $("btnNext").click();
    assert(r, step === "ng_fog", "出現霧");
    assert(r, flags.fog, "已記成霧");
    $("btnBackPath").click();
    assert(r, step === "path_pick", "返回路徑選擇");

    $("btnPathHigh").click();
    assert(r, step === "hs_cloud", "進入高空成雲");
    assert(r, $("captionText").textContent === TEXT.cloud, "成雲說明為課本原文");
    $("btnNext").click();
    assert(r, step === "cloud_pick", "選擇雲中路徑");
    $("btnDropHeavy").click();
    assert(r, step === "drop_rain", "小水滴積聚降雨");
    assert(r, $("captionText").textContent === TEXT.heavy, "積聚說明為課本原文");
    assert(r, flags.dropRain, "已記積聚降雨");
    $("btnBackCloud3").click();

    $("btnDropIce").click();
    assert(r, step === "ice_up", "小水滴上升成冰晶");
    assert(r, $("captionText").textContent === TEXT.iceUp, "上升成冰晶為課本原文");
    $("btnNext").click();
    assert(r, step === "ice_fall", "冰晶下降");
    assert(r, $("captionText").textContent === TEXT.iceFall, "冰晶聚集下降為課本原文");
    $("btnNext").click();
    assert(r, step === "air_temp_pick", "選擇空氣溫度");

    $("btnAirWarm").click();
    assert(r, step === "ice_rain", "高空高於 0℃ 降雨");
    assert(r, $("captionText").textContent === TEXT.airWarm, "高於 0℃ 說明為課本原文");
    assert(r, flags.iceRain, "已記冰晶降雨");
    $("btnTryAirCold").click();
    assert(r, step === "ice_snow", "高空 0℃ 或低於 0℃ 降雪");
    assert(r, $("captionText").textContent === TEXT.airCold, "低溫說明為課本原文");
    $("btnNext").click();
    assert(r, step === "ground_temp_pick", "選擇接近地面溫度");

    $("btnGroundWarm").click();
    assert(r, step === "snow_to_rain", "近地面高於 0℃ 雪變雨");
    assert(r, $("captionText").textContent === TEXT.groundWarm, "雪變雨為課本原文");
    $("btnTryGroundCold").click();
    assert(r, step === "snow_stay", "近地面低溫雪到地");
    assert(r, $("captionText").textContent === TEXT.airCold, "雪到地不加新說明句，維持原降雪句");
    assert(r, $("captionText").textContent.indexOf("繼續") === -1, "沒有自編「繼續是雪」句");

    assert(r, bothMainPathsDone(), "兩條主要路徑已探索完");
    assert(r, !$("btnOverview").disabled, "全部過程已解鎖");
    $("btnOverview").click();
    assert(r, !$("overviewPanel").classList.contains("hidden"), "顯示全部過程");
    var ov = $("overviewFlow").textContent;
    assert(r, ov.indexOf(TEXT.evaporate) !== -1, "總覽含蒸發");
    assert(r, ov.indexOf(TEXT.fog) !== -1 && ov.indexOf("霧") !== -1, "總覽含近地面成霧");
    assert(r, ov.indexOf(TEXT.cloud) !== -1, "總覽含成雲");
    assert(r, ov.indexOf(TEXT.heavy) !== -1, "總覽含積聚降雨");
    assert(r, ov.indexOf(TEXT.iceUp) !== -1 && ov.indexOf(TEXT.iceFall) !== -1, "總覽含冰晶路徑");
    assert(r, ov.indexOf(TEXT.airWarm) !== -1 && ov.indexOf(TEXT.airCold) !== -1, "總覽含兩種空氣溫度");
    assert(r, ov.indexOf(TEXT.groundWarm) !== -1, "總覽含雪變雨");
    $("btnCloseOverview").click();

    // 短練習：支援第 1 題（錯）先答錯再答對；第 2 題答對
    showQuiz();
    startLevel("support");
    assert(r, $("qtext").textContent.indexOf("霧是在高空形成的") !== -1, "支援第 1 題題幹");
    $("optTrue").click();
    assert(r, $("qFeedback").textContent.indexOf("尚未正確") !== -1, "答錯顯示尚未正確與提示");
    $("btnRetryQ").click();
    $("optFalse").click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "改答後正確");
    $("btnNextQ").click();
    $("optTrue").click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "支援第 2 題答對");

    startLevel("basic");
    // 第 1 題：高於 0℃ → 降雨（options[0]）
    $("optList").querySelector('[data-i="0"]').click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "基本：高於 0℃ 選降雨為正確");
    $("btnNextQ").click();
    $("optList").querySelector('[data-i="1"]').click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "基本：0℃ 或低於 0℃ 選降雪為正確");
    $("btnNextQ").click();
    $("optList").querySelector('[data-i="2"]').click();
    assert(r, $("qFeedback").textContent.indexOf("尚未正確") !== -1, "基本：接近地面高於 0℃ 選錯會提示");
    $("btnRetryQ").click();
    $("optList").querySelector('[data-i="0"]').click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "基本：由降雪變成降雨為正確");

    startLevel("challenge");
    // 排序題：按正確順序點選
    var q1 = QUIZ.challenge[0];
    q1.items.forEach(function (t) {
      var btns = $("orderBank").querySelectorAll(".opt");
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent === t) { btns[i].click(); break; }
      }
    });
    $("btnSubmitQ").click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "挑戰：正確排序積聚降雨路徑");
    $("btnNextQ").click();
    $("btnNextQ") && null;
    // 第二題先交不完整
    $("btnSubmitQ").click();
    assert(r, $("qFeedback").textContent.indexOf("請把所有步驟") !== -1, "挑戰：未排完會提示");
    QUIZ.challenge[1].items.forEach(function (t) {
      var btns = $("orderBank").querySelectorAll(".opt");
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent === t) { btns[i].click(); break; }
      }
    });
    $("btnSubmitQ").click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "挑戰：正確排序降雪路徑");
    $("btnNextQ").click();
    // 多選兩條降雨路徑
    $("optList").querySelector('[data-i="0"]').click();
    $("optList").querySelector('[data-i="1"]').click();
    $("btnSubmitQ").click();
    assert(r, $("qFeedback").textContent.indexOf("正確") !== -1, "挑戰：分辨兩條降雨路徑");

    var forbidden = studentForbidden();
    assert(r, forbidden.length === 0, "學生可見文字無禁用詞：" + (forbidden.join("、") || "無"));

    var failed = r.filter(function (x) { return !x.ok; });
    console.log("AUTOTEST_DONE", "passed=" + (r.length - failed.length), "failed=" + failed.length);
    if (failed.length) failed.forEach(function (x) { console.error("AUTOTEST_FAIL", x.msg); });
    return { results: r, failed: failed, passed: r.length - failed.length, total: r.length };
  }

  function studentForbidden() {
    var nodes = document.body.innerText;
    // 老師說明可以提及限制，檢查時暫時收起內容：只看非 teacher 區
    var teacher = $("teacherBox");
    var savedOpen = teacher.open;
    var saved = teacher.innerHTML;
    teacher.innerHTML = "";
    var text = document.body.innerText;
    teacher.innerHTML = saved;
    teacher.open = savedOpen;
    var hits = [];
    if (text.indexOf("想一想") !== -1) hits.push("想一想");
    if (/第\s*\d+\s*課/.test(text)) hits.push("第N課");
    if (text.indexOf("霜") !== -1) hits.push("霜");
    if (text.indexOf("雹") !== -1) hits.push("雹");
    return hits;
  }

  /* 供截圖腳本跳到指定畫面（不在學生介面顯示） */
  window.__gotoShot = function (name) {
    showObserve();
    hideOverview();
    flags = blankFlags();
    flags.evaporated = true;
    history = ["start"];
    if (name === "start") { flags = blankFlags(); history = []; step = "start"; }
    else if (name === "evaporate") { step = "evaporate"; }
    else if (name === "fog") { flags.fog = true; step = "ng_fog"; history = ["start", "evaporate", "path_pick", "ng_cool"]; }
    else if (name === "cloud") { flags.fog = true; flags.cloud = true; step = "hs_cloud"; history = ["start", "evaporate", "path_pick"]; }
    else if (name === "rain") { flags.fog = true; flags.cloud = true; flags.dropRain = true; step = "drop_rain"; history = ["start", "evaporate", "path_pick", "hs_cloud", "cloud_pick"]; }
    else if (name === "snowToRain") {
      flags.fog = true; flags.cloud = true; flags.dropRain = true;
      flags.iceFormed = true; flags.iceSnow = true; flags.snowToRain = true;
      step = "snow_to_rain";
      history = ["start", "evaporate", "path_pick", "hs_cloud", "cloud_pick", "ice_up", "ice_fall", "air_temp_pick", "ice_snow", "ground_temp_pick"];
    } else if (name === "snowStay") {
      flags.fog = true; flags.cloud = true; flags.dropRain = true;
      flags.iceFormed = true; flags.iceSnow = true; flags.snowStay = true;
      step = "snow_stay";
      history = ["start", "evaporate", "path_pick", "hs_cloud", "cloud_pick", "ice_up", "ice_fall", "air_temp_pick", "ice_snow", "ground_temp_pick"];
    } else if (name === "quiz") {
      renderObserve();
      showQuiz();
      startLevel("basic");
      return;
    } else if (name === "overview") {
      flags.fog = true; flags.cloud = true; flags.dropRain = true;
      flags.iceFormed = true; flags.iceRain = true; flags.iceSnow = true; flags.snowToRain = true;
      step = "path_pick";
      renderObserve();
      showOverview();
      return;
    }
    renderObserve();
  };

  window.__autotest = runAutotest;
  window.__getState = function () {
    return { step: step, flags: JSON.parse(JSON.stringify(flags)), mode: mode, quizLevel: quizLevel, quizIndex: quizIndex };
  };

  function bindMain() {
    $("btnNext").addEventListener("click", nextLinear);
    $("btnPrev").addEventListener("click", goPrev);
    $("btnRestart").addEventListener("click", restartObserve);
    $("btnOverview").addEventListener("click", showOverview);
    $("btnCloseOverview").addEventListener("click", hideOverview);
    $("btnGoQuiz").addEventListener("click", showQuiz);
    $("btnBackObserve").addEventListener("click", showObserve);
    $("tabObserve").addEventListener("click", showObserve);
    $("tabQuiz").addEventListener("click", showQuiz);
    document.querySelectorAll(".lv").forEach(function (b) {
      b.addEventListener("click", function () { startLevel(b.getAttribute("data-l")); });
    });
  }

  function init() {
    buildParticles();
    bindMain();
    renderObserve();
    var shot = /(?:\?|&)shot=([A-Za-z]+)/.exec(location.search);
    if (shot) {
      document.documentElement.classList.add("shot-mode");
      window.__gotoShot(shot[1]);
    }
    if (/autotest=1/.test(location.search)) {
      setTimeout(function () {
        var out = runAutotest();
        document.body.setAttribute("data-autotest", out.failed.length === 0 ? "pass" : "fail");
        document.body.setAttribute("data-autotest-passed", String(out.passed));
        document.body.setAttribute("data-autotest-failed", String(out.failed.length));
      }, 50);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
