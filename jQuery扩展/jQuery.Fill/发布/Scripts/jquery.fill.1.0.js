﻿

(function ($) {

    function req(opt) { $.ajax(opt) }
    function isBaseType(o) { return o === null || o instanceof Date || (t = typeof (o)) == "string" || t == "number" || t == "boolean" };
    function pars(str) {
        if (str) {
            var o;
            try { eval("o=" + str) } catch (x) { o = null }
            return o;
        }
        return str;
    }
    function parsePostParams(e) { var p = null; if (!$.isPlainObject(p = pars(e.attr("data-postparams")))) { if ($.isFunction(p)) { p = p.call(this) } else if (p instanceof jQuery) { p = p.modelState().model; } } return p; }
    function getPostParams(s, d) {
        if (!s.length || $.isPlainObject(d)) return d;
        var k = "postparams";
        d = $.data(s[0], k);
        if (!$.isPlainObject(d)) { d = parsePostParams(s);if(!$.isPlainObject(d)) {d = {}}}
        return d;
    }
    /// json填充扩展
    (function () {
        function setValue(e, v, o, path, opt, propertyName) {
            var p = "data-defaultValue";

            $.each(e, function (i, n) {
                var tag = n.tagName
                    , pr = (n = $(n)).attr("data-property")
                    , arg = { item: o, path: path, propertyName: propertyName }, fn = opt && opt.formater
                    , rgx, m;

                if (v === null && (p = n.attr(p))) { v = p }
                else if (typeof (v) == "string" && (m = (/Date\((-?\d+)\)/).exec(v))) {
                    v = new Date(parseInt(m[1]))
                }

                if (typeof (fn) == "function") {
                    v = fn.call(n, v, arg)
                }
                else if (v instanceof Date) {
                    var fm = n.attr("data-dateFormat"), wday;
                    // v=new Date();
                    if (fm) {
                        wday = v.getDay();
                        if ((m = (rgx = /\{w:([^\}]+)\}/).exec(fm))) {
                            m = (m = m[1].split(",")).length == 7 ? m[wday] : "";
                            fm = fm.replace(rgx, m);
                        }
                        v = fm.replace(/\{yyyy\}/g, v.getFullYear()).replace(/\{MM\}/g, v.getMonth() + 1).replace(/\{dd\}/g, v.getDate()).replace(/\{mm\}/g, v.getMinutes()).replace(/\{hh\}/, v.getHours()).replace(/\{ss\}/g, v.getSeconds())
                    }
                    else {
                        v = v.toLocaleString()
                    }
                }


                if (pr) {
                    if (pr == ":html") { n.html(v) }
                    else if (pr == ":text") { n.text(v) }
                    else { n.attr(pr, v) }
                }
                else if (n.is(":checkbox,:radio")) {
                    var tmp = n.val();
                    if (tmp === "" || tmp == "on" || tmp === undefined) { n.val(v) }
                    else { n[0].checked = n.val() == v + "" }
                }
                else if (n.is("input,textarea,select")) { n.val(v) }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v) }
                else if (tag == "IMG") { n.attr("src", v); }
                else if (!n.children().length) { n.text(v) }
            })
        }

        $.prototype.fill = function (url, data, opt, cfn) {
            var fnstr = "function", tmp, root = $(this), callFilling = function (opt, arg, x) {
                var f, pn, fn = "function";
                if (opt && typeof (f = opt.filling) == fn)
                { f(x, arg) }
                if (opt && opt.tree === true && (x instanceof Array) && x.length && (pn = arg.propertyName) && (pn == opt.children || pn.toLowerCase() == "children")) {
                    var creArg = { cancel: false, target: arg.target, children: x, item: arg.item };
                    if ((f = opt.creatingNodes) && typeof (f) == fn) {
                        f.call(root, creArg);
                    }
                    if (!creArg.cancel) {
                        var t = arg.target, tg = t.parent()[0].tagName;
                        t.addClass("has-children").next().clone().appendTo("<" + tg + "></" + tg + ">").parent().appendTo(t);
                    }
                }
            }
            , fn = function (x, path, obj, propertyName, index) {

                var self = this, f, cs
                    , arg = { cancel: false, item: obj, propertyName: propertyName, path: (path = (path || "")), sender: self }
                    , arr = path ? path.split(".") : []
                    ///查找填充目标
                    , find = function (m) {
                        if (!m) return $();
                        var t;
                        try { t = $("#" + m.replace(/\./g, "_"), self) } catch (x) { t = $() }
                        if (t.length == 0) {
                            t = $("[data-fill='" + m + "']", self);
                            if (t.length == 0) {
                                t = $("[data-field='" + m + "']", self);
                                if (t.length == 0) {
                                    t = $("[name='" + m + "']", self)
                                }
                            }
                        }
                        return t
                    }
                , e = arr.length == 0 ? self : find(arr[arr.length - 1]);
                if (!e || e.length == 0) { e = (e = find(path)).length ? e : self }

                arg.target = e;
                callFilling(opt, arg, x);
                if (arg.cancel) { return }

                ///基础数据类型
                if (isBaseType(x)) {
                    if (root != e && e.length) {
                        setValue(e, x, obj, path, opt, propertyName);
                    }
                    return
                }
                ///填充列表数据
                if (x instanceof Array) {
                    var v, ics = "fill-item";
                    if ((f = e.children("." + (cs = "template"))).length || (f = e.find("." + cs)).length) {
                        ///如果不是追加，那么移除已填充的项
                        if (!(opt && opt.append)) { f.prevAll("." + ics).remove() }
                        $.each(x, function (i, n) {
                            var el = f.hide().clone().removeClass(cs).addClass(ics).css({ display: "" });
                            if (opt && typeof (opt.creating) == "function") {
                                var craArg = { cancel: false, item: n, index: i }
                                opt.creating.call(e, craArg, el);
                                if (craArg.cancel) return;
                            }
                            fn.call(el.insertBefore(f), n, path, "", i)
                        })
                    }
                    return
                }
                ///填充对象数据
                if (x instanceof Object) {
                    for (var i in x) {
                        if (!i) continue;
                        var item = x[i];
                        fn.call(e, item, path + (path ? "." : "") + i, x, i, index)
                    }
                    return
                }
            }
            , addState = function (n, v) {
                if (!root.length) return;
                var s = $.data(root[0], "state");
                if (!s) { $.data(root[0], "state", s = {}); }
                s[n] = v;
            }
            , fi = function (d) {

                opt = opt || pars(root.attr("data-options"));

                var type_opt = typeof (opt);
                if (type_opt == fnstr) {
                    opt = typeof (cfn) == fnstr ? { complete: cfn, filling: opt } : { complete: opt };
                }
                else if (type_opt == "boolean") { opt = { pager: opt, complete: cfn } }
                if (d !== null) {
                    if (isBaseType(d)) {
                        setValue(root, d, null, "", opt)
                    }
                    else {
                        var emptyData = root.find(".empty-data"), bindEventN = "boundEvent", p_opt = opt ? opt.pager : null, p, gtp = function (o, n, f) {
                            var some = function (a, cb) {
                                if (a.some) { return a.some(cb); }
                                for (var i = 0; i < a.length; i++) {
                                    if (cb(a[i])) return true
                                }
                                return false;
                            }
                            for (var i in o) {
                                if ((f && i === n) || some(n, function (a) { return a == i.toLowerCase() })) return o[i];
                            }
                            return null;
                        }
                        if (p_opt) {
                            var rows
                            if ((p = (typeof (p_opt.prop) == "string" ? gtp(d, p_opt.prop, true) : null) || gtp(d, ["page", "pager", "paging", "pagination"]))
                                && (rows = (typeof (p_opt.rows) == "string" ? gtp(d, p_opt.rows, true) : null) || gtp(d, ["data", "rows", "list", "array", "collection"])) instanceof Array) {
                                d = rows
                            }
                        }
                        if (!d || (d instanceof Array && d.length == 0)) { emptyData.show(); root.find(".template").hide() } else { emptyData.hide() }
                        fn.call(root, d)
                        ///分页器
                        if (p) {
                            var p_sltr = p_opt.selector || '.pagination', el = root.find(p_sltr), dpn = "data-page", btns = p_opt.buttons, paging = p_opt.paging
                                , total = gtp(p, ["total", "records"]), p_offset = p_opt.offset ? p_opt.offset : 0, p_index = gtp(p, ["index", "pageindex"]) - p_offset, p_next = p_index + 1, p_prev = p_index - 1, p_count = gtp(p, ["count", "pagecount"])

                                , p_size;

                            if (total > 0 && (isNaN(p_count) || p_count <= 0)) {
                                p_size = gtp(p, ["size", "pagesize"]);
                                p_count = total / p_size + (total % p_size > 0 ? 1 : 0);
                            }
                            el.fill(p, opt);
                            if (p_count > 1) {
                                el.show();
                                if (!el.length) { el = $("<ul class='pagination'><li class='first'><a href='javascript:' aria-label='First'><span aria-hidden='true'>&laquo;</span></a></li><li class='number'><a href='javascript:'></a></li><li class='last'><a href='javascript:' aria-label='Last'><span aria-hidden='true'>&raquo;</span></a></li></ul>").appendTo(root); }
                                if (!$.data(el[0], bindEventN)) {
                                    var ev = function () {
                                        var s = $(this), n = Number(s.attr(dpn)), p_arg = { page: n, data: getPostParams(root, data), option: opt, cancel: false };
                                        if (typeof (paging) == fnstr) {
                                            paging.call(this, p_arg);
                                        }
                                        if (!p_arg.cancel) {
                                            if (!p_arg.data) { p_arg.data = {} }
                                            p_arg.data["pageindex"] = n;
                                            if (typeof (url) != "string") { url = root.attr("data-src") }
                                            root.fill(url, p_arg.data, opt, cfn);
                                        }
                                    }
                                    tmp = p_sltr+" a[" + dpn + "][" + dpn + "!='']"
                                    if (el.live) { $(tmp, root).live("click", ev); }
                                    else { root.on("click", tmp, ev); }
                                    $.data(el[0], bindEventN, true);
                                }
                                tmp = "disabled";
                                el.find(".first").toggleClass(tmp, p_index == 0).find('a').attr(dpn, p_index == 0 ? "" : p_offset);
                                el.find(".last").toggleClass(tmp, p_index >= p_count - 1).find('a').attr(dpn, p_index >= p_count - 1 ? "" : p_count - 1 + p_offset);
                                el.find(".next").toggleClass(tmp, p_next >= p_count).find('a').attr(dpn, p_next >= p_count ? "" : p_next + p_offset);
                                el.find(".prev").toggleClass(tmp, p_prev < 0).find('a').attr(dpn, p_prev < 0 ? "" : p_prev + p_offset);
                                tmp = el.find(".number");
                                if (tmp.length) {
                                    if (!btns || isNaN(btns) || btns <= 0) { btns = 10 }
                                    var p_end = p_index + Math.ceil(btns / 2), p_start, item_css = "item", active_css = p_opt.active || 'active';
                                    if (p_end >= p_end) { p_end = p_count - 1; }
                                    p_start = p_end - btns;
                                    if (p_start < 0) { p_start = 0 }
                                    tmp.hide().prevAll('[role="page-number"]').remove();
                                    for (var i = p_start; i <= p_end; i++) {
                                        var clone = tmp.clone().removeClass('number').css('display', '').addClass(item_css).attr('role', 'page-number').insertBefore(tmp), link = clone.find('a').text(i + 1);
                                        if (p_index == i) { clone.addClass(active_css) }
                                        else { link.attr(dpn, i + p_offset)}
                                    }

                                }
                            }
                            else { el.hide() }

                            ///排序
                            if (d && d.length && root.length && !$.data(root[0], bindEventN)) {
                                var thead, sortItemSltr = ".sort", sortHandler = function () {
                                    var s = $(this), sortExp = s.attr("sortExpression") || s.attr("data-sortExpression"), currentCss = "active", desc = "desc"
                                        , handler = $.isFunction(opt.sort) ? opt.sort : ($.isPlainObject(opt.sort) && $.isFunction(opt.sort.handler) ? opt.sort.handler : null)
                                        , sortName = opt.sort.name || "sortExpression", sortValue, s_arg;
                                    if (!s.hasClass(currentCss)) { thead.find(sortItemSltr + "." + currentCss).removeClass(currentCss); s.addClass(currentCss) }
                                    else { s.toggleClass(desc) }
                                    sortValue = sortExp + (s.hasClass(desc) ? " desc" : "");
                                    s_arg = { data: getPostParams(root, data), sortExpression: sortValue, option: opt, cancel: false };
                                    if (handler) { handler.call(this, s_arg); }
                                    if (!s_arg.cancel) {
                                        if (!s_arg.data) { s_arg.data = {} }
                                        s_arg.data[sortName] = sortValue;
                                        addState(sortName, sortValue);
                                        if (typeof (url) != "string") { url = root.attr("data-src") }
                                        root.fill(url, s_arg.data, s_arg.option, cfn);
                                    }
                                }

                                if (opt && opt.sort && (thead = root.find(typeof (opt.sort) == "string" ? opt.sort : (opt.sort.thead ? opt.sort.thead : ".thead"))).length) {
                                    if (thead.live) { $(sortItemSltr, thead).live("click", sortHandler) } else { thead.on("click", sortItemSltr, sortHandler); }
                                }
                                $.data(root[0], bindEventN, true);
                            }




                        }
                    }
                }
                if (opt && typeof (opt.complete) == fnstr) { opt.complete.call(root, d) }
            };

            if (typeof (url) != "string") {
                if (url) {
                    opt = data;
                    data = null
                }
                fi(url);
            }
            else {
                if ((tmp = typeof (data)) == fnstr || tmp == "boolean") { cfn = opt; opt = data; data = null; }
                if (root.length) {
                    data = getPostParams(root, data);
                    if (tmp = $.data(root[0], "state")) {
                        if (!$.isPlainObject(data)) { data = {} }
                        for (var i in tmp) {
                            if (data[i] == null) { data[i] = tmp[i]; }
                        }
                    }
                    $.data(root[0], "postparams", data);
                }
                var loading = opt ? opt.loading : null;
                req({
                    url: url
                    , type: "POST"
                    , dataType: "json"
                    , data: $.toNameValues(data)
                    , success: function (d) { fi(d) }
                    , complete: function () { if (loading.length) { loading.hide(); } }
                    , beforeSend: function () { loading = (loading ? $(loading) : root.find(".loading")).show(); }
                })
            }
            return this
        }

    })();
    ////获取modelState的扩展方法
    (function () {
        var getVal = function (e, pr) {
            var tag = e[0].tagName
            if (pr === undefined) {
                pr = e.attr("data-property")
            }
            var v;
            if (pr) {
                if (pr == ":html") { v = e.html() }
                else if (pr == ":text") { v = e.text() }
                else { v = e.attr(pr) }
            }
            else if (e.is(":checkbox,:radio")) {
                v = e[0].checked ? e.val() : null
            }
            else if (e.is("input[type='file']")) {
                //var udfs, w = window//, sup = getVal.SupportFile || (getVal.SupportFile = typeof (w.File) !== (udfs = 'undefined') && typeof (w.FileList) !== udfs && (typeof (w.Blob) === "function" && (!!w.Blob.prototype.webkitSlice || !!w.Blob.prototype.mozSlice || !!w.Blob.prototype.slice || false)));
                if (e.length) {
                    v = e[0].files;
                    if (!(v instanceof window.FileList)) { v = e.val() } else if (!v.length) { v = null }
                }
            }
            else if (e.is("input,textarea,select")) { v = e.val() }
            else if (tag == "IMG") { v = e.attr("src") }
            else if (!e.children().length) { v = e.text() }
            else { v = null }
            return v
        };
        $.prototype.modelState = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name", m = {}, errors = [];
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]").andSelf()
                , function (i, e) {
                    var v, fn, err = false, lbls, j = $(e), n = j.attr(ne) || j.attr(fl) || j.attr(fd);
                    if (n) {
                        v = getVal(j);
                        if (j.valid && e.form) { try { if (!j.valid()) { err = true; lbls = $(e.form).validate().errorsFor(e) } } catch (x) { } }
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: j, errors: lbls, value: v };
                            err = fn.call(s, v, arg) || err;
                            v = arg.value;
                            if (arg.errors && !lbls)
                            { lbls = arg.errors }
                        }
                        if (v !== null) {
                            var tmp = m[n];
                            if (tmp == null) { m[n] = v }
                            else if (typeof (tmp) == "string") { m[n] = [tmp, v] }
                            else if (tmp instanceof Array) { tmp.push(v) }
                        }
                        if (err) { errors.push({ element: j, value: v, name: n, labels: lbls }) }
                    }
                });
            return { errors: errors && errors.length ? errors : null, model: m }
        };
        $.prototype.clearModel = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name";
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]")
                , function (i, e) {
                    var v, fn, tag = e.tagName, j = $(e), n = j.attr(fd) || j.attr(fl) || j.attr(ne), pr = j.attr("data-property");
                    if (n) {
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: j, cancel: false };
                            v = fn.call(s, getVal(j, pr), arg);
                            if (arg.cancel) return
                        } else { v = fn || "" }
                        if (pr) {
                            if (pr == ":html") { j.html(v) }
                            else if (pr == ":text") { j.text(v) }
                            else { j.attr(pr, v) }
                        }
                        else if (j.is(":checkbox,:radio")) {
                            if (v === "") { v = getVal(j, pr) }
                            j[0].checked = v && j.val() == v
                        }
                        else if (j.is("input,textarea,select")) { j.val(v) }
                        else if (tag == "IMG") { j.attr("src", v) }
                        else { j.text(v) }


                    }
                });
            return s
        }
    })();

    $.extend({
        ///将模型转换成键值对字典。提交复杂的数据模型，转换成键值对，服务端可以直接使用mvc的默认模型绑定器
        toNameValues: function (m) {
            var win = window, filelist = win.FileList, blob = win.Blob, file = win.File, isFormData, isF = function (f) { var b = (filelist && (f instanceof filelist)) || (file && f instanceof file) || (blob && f instanceof blob); if (b && !isFormData) { isFormData = true } return b };
            if (isBaseType(m)) return m;
            var d = {}, fn = function (o, prefix) {
                if (o instanceof Array) {
                    for (var i = 0; i < o.length; i++) {
                        sn(prefix + "[" + i + "]", o[i])
                    }
                }
                else if (o instanceof Object) {
                    for (var i in o) {
                        if (!i) continue;
                        sn(prefix + (prefix ? "." : "") + i, o[i])
                    }
                }
            }
            , sn = function (k, v) {
                if (isBaseType(v)) { d[k] = v instanceof Date ? v.toJSON() : v }
                else if (isF(v)) {
                    if (v instanceof filelist) { for (var i = 0; i < v.length; i++) { d[k + "[" + i + "]"] = v[i] } } else { d[k] = v }

                }
                else { fn(v, k) }
            };
            fn(m, "");
            if (isFormData && win.FormData) {
                var fd = new FormData();
                for (var i in d) {
                    fd.append(i, d[i])
                }
                d = fd;
            }
            return d
        }
    });
    $.ajax = (function (b) {
        return function (url, setting) {
            var s = setting;
            if ($.isPlainObject(url))
            { s = url; }
            if (!s) return;
            if (window.FormData && s.data instanceof FormData) {
                if (s.url) { url = s.url }
                var xhr = new XMLHttpRequest(), ex = function (f) {
                    if (!$.isFunction(f)) return;
                    var a = arguments, p = [];
                    if (a.length > 1) {
                        for (var i = 1; i < a.length; i++) {
                            p.push(a[i]);
                        }
                    }
                    return f.apply(this, p);
                }, r;
                xhr.addEventListener("error", function (e) { ex(s.error, xhr, e) }, false);
                xhr.addEventListener("readystatechange", function () {
                    if (xhr.readyState == 4) {
                        r = xhr.responseText;
                        if (s.dataFilter) { r = ex(s.dataFilter, r, s.dataType) }
                        else { try { r = $.parseJSON(r) } catch (x) { } }
                        if (xhr.status == 200) { ex(s.success, r, xhr.statusText, xhr); }
                        ex(s.complete, xhr, xhr.statusText, xhr.status);
                    }
                }, false);

                xhr.upload.addEventListener("progress", function (e) { ex(s.progress, e, xhr) }, false);
                xhr.open("post", url, s.async || true);
                if (s.headers) {
                    for (var i in s.headers) {
                        xhr.setRequestHeader(i, s.headers[i])
                    }
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                ex(s.beforeSend, xhr)
                xhr.send(s.data)
            }
            else { b.call(this, url, setting); }
        }
    })($.ajax);

    $(function () {
        //====================================================
        var livable = !!$().live, ev = 'click';
        ///填充触发器
        (function () {
            var sltr = "[data-toggle='fill'][data-target]", fn = function () {
                var e = $(this), opt = "data-options",target=e.attr('data-target'),s =target? $(target):e,src='data-src', u = e.attr(src)||s.attr(src);
                if (!u || !s.length) return;
                s.fill(u, parsePostParams(e) || parsePostParams(s) || {}, $.data(this, opt) || pars($(this).attr(opt)))
            };
            //点击时触发
            if (livable) { $(sltr).live(ev, fn) } else { $("body").on(ev, sltr, fn) }
            //装载时触发
            $("[data-src][data-src!=''][data-toggle='load']").each(function (i, e) {fn.call(e)})
        })();
        ///动作触发器
        (function () {
            var sltr = "[data-toggle='action'][data-target]", fn = function () {
                var e = $(this), s = $(e.attr('data-target')), a = "action", d_a = 'data-' + a, u = e.attr(d_a) || s.attr(d_a) || s.attr(a) || location.href,ms;
                if (!s.length) return;
                if (!(ms = s.modelState()).errors) {
                    var m=ms.model, params = parsePostParams(e),reset,result=null,err=null;
                    if (params && $.isPlainObject(params)) { for (var i in m) { params[i] = m[i] } }
                    else { params = m }
                    if ($.isFunction(e.button)) { e.button('loading'); reset=true}
                    $.ajax(u, {
                        type: "POST", dataType: "json", data: $.toNameValues(params),
                        success: function (json) { result = json; s.clearModel() },
                        error: function (req, ts, et) { err = {req:req,textStatus:ts,errorThrown:et}},
                        complete: function () {
                            if (reset === true) { e.button('reset') }
                            var b = $.data(e[0], 'callback') || pars(e.attr('data-callback'));
                            if ($.isFunction(b)) { b.call(e[0], result, { error: err, context: s, posted: params }); }
                        }
                    });
                }
            };
            if (livable) { $(sltr).live(ev, fn) } else { $("body").on(ev, sltr, fn) }
        })();



    })

})(window.jQuery)
