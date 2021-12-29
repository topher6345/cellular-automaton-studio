// https://www.hsluv.org/
(function () {
  for (
    var aa =
        "function" == typeof Object.defineProperties
          ? Object.defineProperty
          : function (a, b, c) {
              a != Array.prototype && a != Object.prototype && (a[b] = c.value);
            },
      x =
        "undefined" != typeof window && window === this
          ? this
          : "undefined" != typeof global && null != global
          ? global
          : this,
      z = ["Array", "prototype", "fill"],
      A = 0;
    A < z.length - 1;
    A++
  ) {
    var B = z[A];
    B in x || (x[B] = {});
    x = x[B];
  }
  var ba = z[z.length - 1],
    C = x[ba],
    D = C
      ? C
      : function (a, b, c) {
          var d = this.length || 0;
          0 > b && (b = Math.max(0, d + b));
          if (null == c || c > d) c = d;
          c = Number(c);
          0 > c && (c = Math.max(0, d + c));
          for (b = Number(b || 0); b < c; b++) this[b] = a;
          return this;
        };
  D != C &&
    null != D &&
    aa(x, ba, { configurable: !0, writable: !0, value: D });
  function ca(a) {
    a = da(a);
    for (var b = a.length, c = 0, d = null, e = null, g = 0; g < b; ) {
      var f = g++,
        m = ha(a[f]);
      if (null == e || m < e) (e = m), (d = f);
    }
    g = a[d];
    f = E(F(g, { a: 0 - 1 / g.a, b: 0 }));
    g = [];
    for (var n, t = 0, h = b - 1; t < h; )
      for (var k = t++, l = k + 1, q = b; l < q; ) {
        var y = l++;
        m = F(a[k], a[y]);
        n = E(m);
        g.push({ j: k, l: y, i: m, B: n, s: ia(n - f) });
      }
    g.sort(function (a, b) {
      return a.s > b.s ? 1 : -1;
    });
    b = [];
    f = [];
    m = [];
    n = [];
    t = 0;
    for (h = g.length; t < h; )
      (k = t++),
        (l = g[k]),
        (k = null),
        l.j == d ? (k = l.l) : l.l == d && (k = l.j),
        null != k &&
          ((d = k),
          n.push(d),
          b.push(a[k]),
          f.push(l.i),
          m.push(l.B),
          (k = G(l.i)),
          k > c && (c = k));
    return { lines: b, c: f, u: m, o: c, A: e };
  }
  function ja(a, b) {
    for (
      var c = E(b), d = a.c.length, e, g = 2 * Math.PI, f = 0, m = 0;
      m < d;

    ) {
      var n = m++;
      e = ia(a.u[n] - c);
      e < g && ((g = e), (f = n));
    }
    d = (f - 1 + d) % d;
    e = a.lines[d];
    if (G(b) < e.b / (Math.sin(c) - e.a * Math.cos(c))) return b;
    c = -1 / e.a;
    b = F(e, { a: c, b: b.y - c * b.x });
    f = a.c[f];
    c = a.c[d];
    f.x > c.x ? ((a = f), (f = c)) : (a = c);
    return b.x > a.x ? a : b.x < f.x ? f : b;
  }
  function F(a, b) {
    b = (a.b - b.b) / (b.a - a.a);
    return { x: b, y: a.a * b + a.b };
  }
  function G(a) {
    return Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
  }
  function ha(a) {
    return Math.abs(a.b) / Math.sqrt(Math.pow(a.a, 2) + 1);
  }
  function E(a) {
    return Math.atan2(a.y, a.x);
  }
  function ia(a) {
    var b = 2 * Math.PI;
    return ((a % b) + b) % b;
  }
  function da(a) {
    var b = [],
      c = Math.pow(a + 16, 3) / 1560896;
    c = c > ka ? c : a / H;
    for (var d = 0; 3 > d; ) {
      var e = d++,
        g = I[e][0],
        f = I[e][1];
      e = I[e][2];
      for (var m = 0; 2 > m; ) {
        var n = m++,
          t = (632260 * e - 126452 * f) * c + 126452 * n;
        b.push({
          a: ((284517 * g - 94839 * e) * c) / t,
          b:
            ((838422 * e + 769860 * f + 731718 * g) * a * c - 769860 * n * a) /
            t,
        });
      }
    }
    return b;
  }
  function J(a, b) {
    b = (b / 360) * Math.PI * 2;
    a = da(a);
    for (var c = Infinity, d = 0; d < a.length; ) {
      var e = a[d];
      ++d;
      e = e.b / (Math.sin(b) - e.a * Math.cos(b));
      0 <= e && (c = Math.min(c, e));
    }
    return c;
  }
  function L(a, b) {
    for (var c = 0, d = 0, e = a.length; d < e; ) {
      var g = d++;
      c += a[g] * b[g];
    }
    return c;
  }
  function M(a) {
    return 0.0031308 >= a
      ? 12.92 * a
      : 1.055 * Math.pow(a, 0.4166666666666667) - 0.055;
  }
  function N(a) {
    return 0.04045 < a ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
  }
  function O(a) {
    return [M(L(I[0], a)), M(L(I[1], a)), M(L(I[2], a))];
  }
  function P(a) {
    var b = a[0];
    if (0 == b) return [0, 0, 0];
    var c = a[1] / (13 * b) + la;
    a = a[2] / (13 * b) + ma;
    b = 8 >= b ? (Q * b) / H : Q * Math.pow((b + 16) / 116, 3);
    c = 0 - (9 * b * c) / ((c - 4) * a - c * a);
    return [c, b, (9 * b - 15 * a * b - a * c) / (3 * a)];
  }
  function na(a) {
    var b = a[0],
      c = a[1],
      d = a[2];
    a = Math.sqrt(c * c + d * d);
    1e-8 > a
      ? (c = 0)
      : ((c = (180 * Math.atan2(d, c)) / Math.PI), 0 > c && (c = 360 + c));
    return [b, a, c];
  }
  function R(a) {
    var b = a[1],
      c = (a[2] / 360) * 2 * Math.PI;
    return [a[0], Math.cos(c) * b, Math.sin(c) * b];
  }
  function S(a) {
    var b = a[0],
      c = a[1];
    a = a[2];
    if (99.9999999 < a) return [100, 0, b];
    if (1e-8 > a) return [0, 0, b];
    c = (J(a, b) / 100) * c;
    return [a, c, b];
  }
  function va(a) {
    var b = a[0],
      c = a[1];
    a = a[2];
    if (99.9999999 < b) return [a, 0, 100];
    if (1e-8 > b) return [a, 0, 0];
    var d = J(b, a);
    return [a, (c / d) * 100, b];
  }
  function T(a) {
    for (var b = "#", c = 0; 3 > c; ) {
      var d = c++;
      d = Math.round(255 * a[d]);
      var e = d % 16;
      b += U.charAt(((d - e) / 16) | 0) + U.charAt(e);
    }
    return b;
  }
  var I = [
      [3.240969941904521, -1.537383177570093, -0.498610760293],
      [-0.96924363628087, 1.87596750150772, 0.041555057407175],
      [0.055630079696993, -0.20397695888897, 1.056971514242878],
    ],
    V = [
      [0.41239079926595, 0.35758433938387, 0.18048078840183],
      [0.21263900587151, 0.71516867876775, 0.072192315360733],
      [0.019330818715591, 0.11919477979462, 0.95053215224966],
    ],
    Q = 1,
    la = 0.19783000664283,
    ma = 0.46831999493879,
    H = 903.2962962,
    ka = 0.0088564516,
    U = "0123456789abcdef";
  function W(a, b) {
    a = parseFloat(a);
    return 0 <= a && a <= b;
  }
  function X(a) {
    for (var b = [], c = 0; c < a; c++) b.push(c / (a - 1));
    return b;
  }
  function wa(a, b) {
    function c(b) {
      var c = a.getBoundingClientRect();
      if (b.touches) {
        var d = b.touches[0].clientX;
        b = b.touches[0].clientY;
      } else (d = b.clientX), (b = b.clientY);
      return {
        x: Math.min(1, Math.max(0, (d - c.left) / c.width)),
        y: Math.min(1, Math.max(0, (b - c.top) / c.height)),
      };
    }
    function d(a) {
      if (3 !== a.which) {
        var b = c(a);
        m(b) && ((n = !0), a.preventDefault(), f(b));
      }
    }
    function e() {
      n = !1;
    }
    function g(a) {
      n && (a.preventDefault(), f(c(a)));
    }
    var f = b.m,
      m =
        b.v ||
        function () {
          return !0;
        },
      n = !1;
    a.addEventListener("mousedown", d);
    a.addEventListener("touchstart", d);
    document.addEventListener("mousemove", g);
    document.addEventListener("touchmove", g);
    document.addEventListener("mouseup", e);
    document.addEventListener("touchend", e);
  }
  function Y(a, b, c) {
    var d = this;
    this.f = a;
    this.h = b;
    this.g = document.createElement("div");
    this.g.className = "range-slider-handle";
    this.w = this.f.getBoundingClientRect().width;
    a.appendChild(this.g);
    wa(this.f, {
      m: function (a) {
        Z(d, a.x);
        c(a.x);
      },
    });
  }
  function Z(a, b) {
    a.h = b;
    a.g.style.left = a.h * a.w - 5 + "px";
  }
  function xa(a, b) {
    a.f.style.background = "linear-gradient(to right," + b.join(",") + ")";
  }
  document.addEventListener("DOMContentLoaded", function () {
    function a(a) {
      return { x: a.x * m + 200, y: 200 - a.y * m };
    }
    function b(a) {
      return { x: (a.x - 200) / m, y: (200 - a.y) / m };
    }
    function c() {
      v.setAttribute("fill", t);
      r.setAttribute("stroke", t);
      if (0 !== f && 100 !== f) {
        var b = (J(f, e) * g) / 100,
          c = (e / 360) * 2 * Math.PI;
        b = a({ x: b * Math.cos(c), y: b * Math.sin(c) });
        p.setAttribute("cx", b.x.toString());
        p.setAttribute("cy", b.y.toString());
        p.setAttribute("stroke", t);
        p.style.display = "inline";
        r.setAttribute("r", (m * n.A).toString());
      } else (p.style.display = "none"), r.setAttribute("r", "0");
      b = X(20).map(function (a) {
        return T(O(P(R(S([360 * a, g, f])))));
      });
      c = X(10).map(function (a) {
        return T(O(P(R(S([e, 100 * a, f])))));
      });
      var d = X(10).map(function (a) {
        return T(O(P(R(S([e, g, 100 * a])))));
      });
      xa(pa, b);
      xa(qa, c);
      xa(ra, d);
    }
    function d(d, l, K, h) {
      K && ((t = 70 < f ? "#1b1b1b" : "#ffffff"), (n = ca(f)), (m = 190 / n.o));
      c();
      var u = T(O(P(R(S([e, g, f])))));
      palette.color = u;
      ya.style.backgroundColor = u;
      6 !== h && (y.value = u);
      if (
        K &&
        ((u = n.c.map(a)),
        k.clearRect(0, 0, 400, 400),
        (k.globalCompositeOperation = "source-over"),
        0 !== f && 100 !== f)
      ) {
        for (var p = [], q = [], w, r = 0; r < u.length; r++)
          (w = u[r]), p.push(w.x), q.push(w.y);
        r = Math.floor(Math.min.apply(Math, p) / 8);
        w = Math.floor(Math.min.apply(Math, q) / 8);
        p = Math.ceil(Math.max.apply(Math, p) / 8);
        for (q = Math.ceil(Math.max.apply(Math, q) / 8); r < p; r++)
          for (var v = w; v < q; v++) {
            var oa = 8 * r,
              sa = 8 * v,
              ta = ja(n, b({ x: oa + 4, y: sa + 4 }));
            k.fillStyle = T(O(P([f, ta.x, ta.y])));
            k.fillRect(oa, sa, 8, 8);
          }
        k.globalCompositeOperation = "destination-in";
        k.beginPath();
        k.moveTo(u[0].x, u[0].y);
        for (p = 1; p < u.length; p++) (w = u[p]), k.lineTo(w.x, w.y);
        k.closePath();
        k.fill();
      }
      d && 0 !== h && Z(pa, e / 360);
      l && 1 !== h && Z(qa, g / 100);
      K && 2 !== h && Z(ra, f / 100);
      d && 3 !== h && (ea.value = e.toFixed(1));
      l && 4 !== h && (fa.value = g.toFixed(1));
      K && 5 !== h && (ua.value = f.toFixed(1));
    }

    var e = 0,
      g = 100,
      f = 50,
      m = 1,
      n,
      t,
      h = document.getElementById("picker"),
      k = h.getElementsByTagName("canvas")[0].getContext("2d"),
      l = document
        .getElementById("control-s")
        .getElementsByClassName("range-slider")[0],
      q = document
        .getElementById("control-h")
        .getElementsByClassName("range-slider")[0],
      y = h.getElementsByClassName("input-hex")[0],
      ea = h.getElementsByClassName("counter-hue")[0],
      fa = h.getElementsByClassName("counter-saturation")[0],
      ua = h.getElementsByClassName("counter-lightness")[0],
      ya = h.getElementsByClassName("swatch")[0];
    h = h.getElementsByTagName("svg")[0];

    var ra = new Y(
        document
          .getElementById("control-l")
          .getElementsByClassName("range-slider")[0],
        0.5,
        function (a) {
          f = 100 * a;
          d(!1, !1, !0, 2);
        }
      ),
      qa = new Y(l, 0.5, function (a) {
        g = 100 * a;
        d(!1, !0, !1, 1);
      }),
      pa = new Y(q, 0, function (a) {
        e = 360 * a;
        d(!0, !1, !0, 0);
      });

    ea.addEventListener("input", function () {
      W(this.value, 360) && ((e = parseFloat(this.value)), d(!0, !1, !1, 3));
    });

    fa.addEventListener("input", function () {
      W(this.value, 100) && ((g = parseFloat(this.value)), d(!1, !0, !1, 4));
    });

    ua.addEventListener("input", function () {
      W(this.value, 100) && ((f = parseFloat(this.value)), d(!1, !1, !0, 5));
    });
    l = a({ x: 0, y: 0 });

    var r = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    r.setAttribute("cx", l.x.toString());
    r.setAttribute("cy", l.y.toString());
    r.setAttribute("fill", "none");
    r.setAttribute("stroke-width", "2");
    h.appendChild(r);

    var v = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    v.setAttribute("cx", l.x.toString());
    v.setAttribute("cy", l.y.toString());
    v.setAttribute("r", (2).toString());

    h.appendChild(v);
    q = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    q.setAttribute("cx", l.x.toString());
    q.setAttribute("cy", l.y.toString());
    q.setAttribute("r", (190).toString());
    q.setAttribute("fill", "none");
    q.setAttribute("stroke", "white");
    q.setAttribute("stroke-width", "1");
    h.appendChild(q);
    var p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    p.setAttribute("cx", l.x.toString());
    p.setAttribute("cy", l.y.toString());
    p.setAttribute("r", "4");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke-width", "2");
    p.style.display = "none";
    p.className = "scope";
    h.appendChild(p);
    wa(h, {
      m: function (a) {
        a = b({ x: 400 * a.x, y: 400 * a.y });
        a = ja(n, a);
        a = va(na([f, a.x, a.y]));
        e = a[0];
        g = a[1];
        d(!0, !0, !1, null);
      },
      v: function (a) {
        return G(b({ x: 400 * a.x, y: 400 * a.y })) < n.o;
      },
    });
    y.addEventListener("input", function () {
      var a = y.value.match(/^\s*#?([0-9a-f]{6})\s*$/i);
      a = a ? "#" + a[1] : null;
      if (null !== a) {
        a = a.toLowerCase();
        for (var b = [], c = 0; 3 > c; ) {
          var h = c++;
          b.push(
            (16 * U.indexOf(a.charAt(2 * h + 1)) +
              U.indexOf(a.charAt(2 * h + 2))) /
              255
          );
        }
        a = [N(b[0]), N(b[1]), N(b[2])];
        c = [L(V[0], a), L(V[1], a), L(V[2], a)];
        b = c[0];
        a = c[1];
        c = b + 15 * a + 3 * c[2];
        0 != c ? ((b = (4 * b) / c), (c = (9 * a) / c)) : (c = b = NaN);
        a =
          a <= ka
            ? (a / Q) * H
            : 116 * Math.pow(a / Q, 0.3333333333333333) - 16;
        a = va(
          na(0 == a ? [0, 0, 0] : [a, 13 * a * (b - la), 13 * a * (c - ma)])
        );
        e = a[0];
        g = a[1];
        f = a[2];
        d(!0, !0, !0, 6);
      }
    });
    d(!0, !0, !0, null);
  });
})();
