/*
 * Time-of-day background.
 * Interpolates a vertical pastel gradient (and matching text colors)
 * from the visitor's local time. Night = deep lilac, day = peach → butter yellow.
 * Preview any hour with ?hour=13.5
 */
(function () {
  // [hour, top color, bottom color]
  var STOPS = [
    [0,    '#2B2342', '#46385F'],    // midnight — deep lilac
    [4.5,  '#2F2747', '#4E3F68'],    // late night
    [6,    '#5E4C7C', '#B5869E'],  // dawn — lavender to dusty rose
    [7.5,  '#F2B49B', '#F8D3B0'],    // sunrise — soft peach
    [10,   '#F6C29A', '#FAE0A8'],    // morning — apricot to cream
    [13,   '#F8D49E', '#FBEDB5'],    // midday — butter yellow
    [16.5, '#F5B992', '#F9DAA4'],    // afternoon — warm apricot
    [19,   '#E8A0A0', '#B996BE'], // sunset — blush to lavender
    [20.5, '#54436F', '#77628F'],  // dusk
    [22,   '#3A2F56', '#54447A'],    // evening
    [24,   '#2B2342', '#46385F']     // wraps to midnight
  ];

  // Text colors for a light sky and a dark sky
  var DAY   = { brand: '#D9573E', muted: '#5C5170', footer: '#564C67' };
  var NIGHT = { brand: '#F4907A', muted: '#F3EEF9', footer: '#ECE6F5' };

  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixRgb(x, y, t) {
    return [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); });
  }
  function css(c) { return 'rgb(' + c.join(',') + ')'; }
  // WCAG relative luminance
  function lum(c) {
    var v = c.map(function (x) {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  // Whichever of the two colors reads better on this background
  function pick(bg, dayHex, nightHex) {
    var d = hexToRgb(dayHex), n = hexToRgb(nightHex);
    return contrast(bg, d) >= contrast(bg, n) ? dayHex : nightHex;
  }
  // Smooth easing so transitions between stops feel natural
  function ease(t) { return t * t * (3 - 2 * t); }

  function currentHour() {
    var q = /[?&]hour=([\d.]+)/.exec(location.search);
    if (q) return parseFloat(q[1]) % 24;
    var d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }

  function apply() {
    var h = currentHour(), i = 0;
    while (i < STOPS.length - 2 && h >= STOPS[i + 1][0]) i++;
    var a = STOPS[i], b = STOPS[i + 1];
    var t = ease((h - a[0]) / (b[0] - a[0]));
    var topRgb = mixRgb(hexToRgb(a[1]), hexToRgb(b[1]), t);
    var botRgb = mixRgb(hexToRgb(a[2]), hexToRgb(b[2]), t);
    var top = css(topRgb);

    // Each text color is chosen against the sky right behind it:
    // headline/subhead sit mid-screen, the footer sits at the bottom
    var midRgb = mixRgb(topRgb, botRgb, 0.5);
    var footRgb = mixRgb(topRgb, botRgb, 0.95);

    var s = document.documentElement.style;
    s.setProperty('--bg-top', top);
    s.setProperty('--bg-bottom', css(botRgb));
    s.setProperty('--brand', pick(midRgb, DAY.brand, NIGHT.brand));
    s.setProperty('--muted', pick(midRgb, DAY.muted, NIGHT.muted));
    s.setProperty('--footer', pick(footRgb, DAY.footer, NIGHT.footer));

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', top);
  }

  apply();
  setInterval(apply, 60 * 1000);
})();
