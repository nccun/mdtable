(function($){
  'use strict';
  /**
   * custom table with sorting and pagination
   * 自定义表格， 支持排序、分页
   */
  $.fn.mdtable = function(option) {
    var table = this;
    option = $.extend(true, {}, $.fn.mdtable.defaults, option);
    // templates
    // 页面模板
    var template = {
      checkbox: {
        th: '<th width="38" class="check"><label class="checkbox-primary"></label></th>',
        td: '<td class="check"><label class="checkbox-primary"></label></td>'
      },
      error: '<tr><td class="mdtable-error" colspan="' + (option.columns.length + (option.multicheck?1:0)) +'">'+ option.message.error + '</td></tr>',
      empty: '<tr><td class="mdtable-empty" colspan="' + (option.columns.length + (option.multicheck?1:0)) +'">'+ option.message.empty + '</td></tr>',
      timeout: '<tr><td class="mdtable-timeout" colspan="' + (option.columns.length + (option.multicheck?1:0)) +'">'+ option.message.timeout + '</td></tr>',
      paging: '<nav class="pull-right"><ul class="pagination"><li class="first hidden"><a class="disabled" data-page="f">' + option.paging.firstText +
        '</a></li><li class="pre"><a class="disabled" data-page="p">' + option.paging.preText + '</a></li><li class="page"><a data-page="1">1</a></li><li class="next"><a class="disabled" data-page="n">' +
        option.paging.nextText + '</a></li><li class="last hidden"><a class="disabled" data-page="l">' + option.paging.lastText + '</a></li></ul></nav>'
    };

    // table datas
    // 表格中的数据
    var _data = {count:0,data:[]};
    // ajax data
    // 其余查询条件
    var _extra = option.extra;
    // current sorting column
    // 当前排序的列
    var _sortingCol = -1;
    // only one column to sort
    // 只有一列可以默认排序
    var _onlySortable = false;

    // wrap the table and add with pagination
    // 给table包裹div并添加分页组件
    this.wrap('<div class="'+ option.wrapClass +' md-table-wrap"></div>').after(template.paging);
    var tableWrap = table.parent();
    // get thead and tbody
    // 获取thead和tbody
    var th = this.find('thead'), tb = this.find('tbody');
    if (!tb.length) {
      th.after('<tbody></tbody>');
      tb = this.find('tbody');
    }

    // sortable columns
    // 列排序功能
    for (var i = 0; i < option.columns.length; i++) {
      var col = option.columns[i],
        thCol = th.find('th,td').eq(i);

      // is sortable
      // 是否开启排序功能
      if (col.sort && col.sort.enable) {
        if (!_onlySortable && col.sort['default']) {
          if (col.sort['default'] === 'asc') {
            thCol.addClass('sorting_asc');
          } else if (col.sort['default'] === 'desc') {
            thCol.addClass('sorting_desc');
          }
          _sortingCol = i;
          _onlySortable = true;
        } else {
          thCol.addClass('sorting');
        }
      }
    }
    th.on('click', 'th:not(.check),tr:not(.check)', function() {
      var $this = $(this),
        $index = th.find('th:not(.check)').index($this);
      _sortingCol = $index;
      if ($this.hasClass('sorting_desc')) {
        $this.removeClass('sorting_desc').addClass('sorting_asc');
        doSort($index, 'asc');
      } else {
        $this.removeClass('sorting sorting_asc').addClass('sorting_desc');
        doSort($index, 'desc');
      }
      $this.siblings().filter('.sorting,.sorting_asc,.sorting_desc').removeClass('sorting_asc sorting_desc').addClass('sorting');
    });

    // handler load.ok and load.error event
    // 数据加载完成
    table.on('load.ok', function() {
      // console.log('load ok');
    })
    .on('load.error', function(){
      // console.error('load error');
    });
    // pagination's parameters
    // 分页相关参数
    var pages = 1, count = 0, start = 0, limit = option.paging.limit, current = 1, pre_current = 1;
    // pagination widget
    // 分页组件
    var pagDom = table.next().find('.pagination').hide();
    var pagination = {
      first: pagDom.find('li.first'),
      first_a: pagDom.find('li.first a'),
      pre: pagDom.find('li.pre'),
      pre_a: pagDom.find('li.pre a'),
      page: pagDom.find('li.page'),
      next: pagDom.find('li.next'),
      next_a: pagDom.find('li.next a'),
      last: pagDom.find('li.last'),
      last_a: pagDom.find('li.last a')
    };
    // page changed event
    // 换页事件
    table.on( 'page.change', function(){
      // active styles
      // active样式
      pagDom.find('li.page a').eq(current-1).addClass('active');
      if (current === 1) {
        pagination.pre_a.addClass('disabled');
      } else {
        pagination.pre_a.removeClass('disabled');
      }
      if (current === pages) {
        pagination.next_a.addClass('disabled');
      } else {
        pagination.next_a.removeClass('disabled');
      }
      // remove all checkboxs' 'checked' class
      // 取消所有的选择按钮的选中状态
      table.find('.checkbox-primary').removeClass('checked');
    });
    // paginations' click event(not disabled and not current page)
    // 分页组件(非禁用、非当前按钮)的点击事件
    pagDom.delegate('li a:not(.disabled,.active)', 'click', function(){
      var $this = $(this), targetPage = $this.data('page');
      if (targetPage === 'f') {
        start = 0; pre_current = 0;
      } else if (targetPage === 'p') {
        start = start - limit; pre_current --;
      } else if (targetPage === 'n') {
        start = start + limit; pre_current ++;
      } else if (targetPage === 'l') {
        start = (pages - 1) * limit; pre_current = pages;
      } else {
        targetPage = parseInt(targetPage);
        start = (targetPage - 1) * limit; pre_current = targetPage;
      }
      if (option.mode === 'remote') {
        load(_extra);
      } else if (option.mode === 'local') {
        loadData();
      }

    });
    // checkbox
    // 多选框按钮
    if (option.multicheck.enable) {
      th.find('tr').prepend(template.checkbox.th);
      // thead's checkbox dom
      // 顶部checkbox
      var hc = th.find('.checkbox-primary');
      this.delegate('.checkbox-primary', 'click', function(){
        var $this = $(this),
          // tbody's checkbox dom
          // tbody中的checkbox
          bc = tb.find('.checkbox-primary');
        $this.toggleClass('checked');
        if ($this.closest('thead').length > 0) {
          // thead's checkbox handler
          // 顶部checkbox的处理
          if ($this.hasClass('checked')) {
            bc.addClass('checked');
          } else {
            bc.removeClass('checked');
          }
        } else {
          // tbody's checkbox handler
          // tbody中的checkbox的处理
          if (bc.filter('.checked').length === bc.length) {
            hc.addClass('checked');
          } else {
            hc.removeClass('checked');
          }
        }
        // select.change callback
        // 回调事件
        var indexs = [],checked = bc.filter('.checked');
        checked.each(function(i, e){
          indexs.push(bc.index(e));
        });
        table.trigger('select.change', [indexs]);
      });
    }


    /**
     * 排序方法
     * sort function
     * @param col 排序的列
     *            column index to sort
     * @param order 排序的顺序，默认升序
     *              the order to sort, default is 'asc'
     */
    var doSort = function(sortCol, order) {
      // clear table
      // 先清空table内容
      tb.empty();
      var data = _data.data;
      if (data.length) {
        // prevent that data.length gt limit
        // 防止返回数据条数大于每页显示数
        if (option.mode !== 'local' && data.length > limit) {
          data.length = limit;
        }
        if (!sortCol) {
          sortCol = _sortingCol;
        }
        if (sortCol !== -1) {
          var column = option.columns[sortCol];
          if (th.find('th:not(.check)').eq(sortCol).hasClass('sorting_desc')) {
            order = 'desc';
          } else {
            order = 'asc';
          }
          data.sort(function(a, b){
            var da = a[column.row],
              db = b[column.row];
            if (column.rule && typeof  column.rule === 'function') {
              return column.rule(a, b) * (order === 'desc'?-1:1);
            } else {
              return da.toString().localeCompare(db.toString()) * (order === 'desc'?-1:1);
            }
          });
          if (option.mode === 'local') {
            data = data.slice((pre_current - 1) * limit, pre_current * limit);
          }
        }
        // insert datas
        // 循环插入数据
        for(var j = 0; j < data.length; j++) {
          var tr = $('<tr></tr>').addClass(j % 2 === 0 ? 'odd': 'even');
          // insert checkbox
          // 插入多选框
          if (option.multicheck.enable) {
            tr.append(template.checkbox.td);
          }
          // insert columns
          // 循环插入列值
          for(var k = 0; k < option.columns.length; k++) {
            var col = option.columns[k];
            var v = data[j][col.row];
            // column renderer
            // 列渲染
            if (col.renderer && typeof col.renderer === 'function') {
              v = col.renderer(v, data[j], data);
            }
            if (!(v instanceof $)) {
              v = $('<td' + (col.class?(' class="' + col.class + '"'):'') + '>'+ v + '</td>');
            } else {
              v.wrap('<td' + (col.class?(' class="' + col.class + '"'):'') + '></td>');
              v = v.parent();
            }
            tr.append(v);
          }
          // tr row renderer
          // tr行渲染
          if (option.trRenderer) {
            option.trRenderer(tr);
          }
          // set tr's data['row'] with it's data
          tr.data('row', data[j]);
          tb.append(tr);
        }
      } else {
        tb.empty().append(template.empty);
      }
    };

    /**
     * 请求资源
     * ajax load data
     * @param extra 请求时发送的数据
     *              ajax data parameter
     */
    var load = function(extra) {
      var data = $.extend({}, extra, {start:start, limit: limit});
      _extra = extra?extra:_extra;
      $.load({
        url: (extra && extra.url)?extra.url:option.url,
        data: data,
        target: tableWrap,
        loading: option.loading,
        cache: option.cache?option.cache:false,
        success: function(data) {
          _data = data;
          loadData();
        },
        error: function(xhr, status){
          _data = {};
          if (status === 'timeout') {
            tb.empty().append(template.timeout);
          } else {
            tb.empty().append(template.error);
          }
          table.trigger('load.error');
        }
      });
    };

    /**
     * 让表格加载数据
     * renderer the data to the table
     * @param data 格式:{count:xx,data:[{},{},...]}
     *             like:{count:xx,data:[{},{},...]}
     */
    var loadData = function() {
      var data = null;
      if (option.mode === 'local') {
        data = {
          count: _data.data.length,
          data: _data.data.slice((pre_current-1)*limit,pre_current*limit)
        };
      } else if (option.mode === 'remote') {
        data = _data;
      }
      if (data.data) {
        // when data.count gt limit then the pagination shows
        // 数据数量大于一页总数时分页
        if (data.count > limit) {
          pagDom.show();
          count = data.count;
          pages = Math.ceil(count / limit);
          current = pre_current;
          // clear all page item and then add current pages
          // 先清空所有的页数，再添加
          pagDom.find('li.page').remove();
          for (var i = 0; i < pages; i++) {
            var p = pagination.page.clone();
            var a = p.find('a').attr('data-page', i+1).text(i+1);
            pagination.next.before(p);
          }
          table.trigger('page.change');
        } else {
          pagDom.hide();
        }
        doSort(null);
      } else {
        tb.empty().append(template.error);
      }
      table.trigger('load.ok');
    };

    // load data for the first time
    // 首次请求数据
    if (option.mode === 'remote') {
      load(option.extra);
    } else if (option.mode === 'local') {
      loadData(option.data);
    }
    // public method load with a parameter 'extra',
    // load data with ajax and the extra parameter
    // 添加额外数据进行查询，查询条件添加到ajax请求中
    this.load = function(extra) {
      if (option.mode === 'local') {
        throw new Error('current is local mode.');
      }
      start = 0;
      load(extra);
    };
    //public method loadData with a parameter 'data'
    // load data with the giving data
    this.loadData = function(data) {
      if (option.mode === 'remote') {
        throw new Error('current is remote mode.');
      }
      start = 0;
      _data = data;
      loadData();
    };
    // public method addData with a parameter 'data'
    // add datas to the current table
    this.addData = function(datas) {
      if (option.mode === 'remote') {
        throw new Error('current is remote mode.');
      }
      Array.prototype.push.apply(_data.data, datas);
      loadData();
    };
    // remove all datas
    // 删除所有数据
    this.removeDatas = function() {
      _data.data = [];
      th.find('.check .checkbox-primary').removeClass('checked');
      loadData();
    };
    // remove selected datas
    // 删除选中的行
    this.removeSelectedDatas = function() {
      var checkboxes = tb.find('.checkbox-primary'),
        checked = checkboxes.filter('.checked');
      for (var i = checked.length - 1; i >= 0; i--) {
        _data.data.splice(checkboxes.index($(checked[i])), 1);
      }
      if (_data.data.length === 0) {
        th.find('.check .checkbox-primary').removeClass('checked');
      }
      loadData();
    };
    // public method getDatas, return the datas in the table
    this.getDatas = function() {
      return _data.data;
    };
    // public method returns the selected rows(start with 0)
    this.getSelection = function() {
      var checkboxes = tb.find('.checkbox-primary'),
        checked = checkboxes.filter('.checked');
      var r = [];
      $.each(checked, function(i, c){
        r.push(checkboxes.index($(c)));
      });
      return r;
    };
    return table;
  };
  /**
   * tables's defaults
   * 自定义表格的默认设置
   */
  $.fn.mdtable.defaults = {
    // tables's wrapper
    // table包裹层
    wrapClass: 'table-responsive',
    // messages
    // 信息
    message: {
      empty: '暂无数据',
      error: '数据请求出错',
      timeout: '请求超时'
    },
    // 是否显示loading图
    // to show the loading img or not
    loading: 'show',
    // 数据请求模式：本地和远程
    // data request mode: local or remote
    mode: 'remote',
    // ajax cache
    // ajax缓存
    cache: false,
    // multy checkbox, default is disabled
    // 是否添加多选
    multicheck: {
      enable: false,
      callback: null
    },
    // pagination settings
    // 分页相关
    paging: {
      // data's count limited in one page
      // 每页多少条记录
      limit: 10,
      // the character 'first' in pagination 
      // 分页【首页】字符
      firstText: '<<',
      // the character 'last' in pagination 
      // 分页【尾页】字符
      lastText: '>>',
      // the character 'preview' in pagination 
      // 分页【前一页】字符
      preText: '<',
      // the character 'next' in pagination 
      // 分页【后一页】字符
      nextText: '>'
    }    
  };

  /**
   * re-package the $.ajax method
   * before ajax show the loading, when it complete hide the loading
   * parameter 'target' means the dom to show ajax loading
   * ajax方法的重新封装，发送ajax前添加loading，成功后取消loading
   * 参数target表示在什么dom节点上显示loading信息
   */
  $.extend({
    load: function(option) {
      option = $.extend({}, $.loadDefaults, option);
      var target = $(option.target);
      if (option.loading !== 'hide') {
        option.beforeSend = function() {
          target.loading('show');
        };
        option.complete = function() {
          target.loading('hide');
        };
      }
      $.ajax(option);
    },
    loadDefaults: {
      type: 'get',
      loading: 'show',
      timeout: 10000,
      target: window
    }
  });

  /**
   * custom checkbox
   * 自定义的多选框
   */
  $.fn.checkbox = function() {
    this.on('click', function(){
      $(this).toggleClass('checked');
    });
  };

  /**
   * custom loading method, parameter is 'show' or 'hide'
   * loading,参数show|hide
   */
  $.fn.loading = function(option) {
    option = option||'show';
    var mask = $('.md-mask').eq(parseInt(this.attr('data-loading') - 1));
    if (mask.length === 0) {
      mask = $('<div class="md-mask"><div class="md-loading"><img src="images/loading.gif" alt="loading"/></div></div>');
      $('body').append(mask);
      this.attr('data-loading', $('.md-mask').length);
    }
    if (option === 'show') {
       mask.show();
      var load = mask.find('.md-loading');
      var h = this.outerHeight(),
        w = this.outerWidth(),
        offset = this.offset(),
        lh = 24,
        lw = 60;
      if (this[0] === window) {
        mask.css({top:0,left:0,width:w,height:h}).removeClass('hidden');
      } else {
        var width = w > lw ? w : lw,
          height = h > lh ? h : lh;
        mask.css({top: offset.top,left: offset.left,width: width, height: height}).removeClass('hidden');
      }
      load.css('margin-top', (mask.height() - load.height()) / 2);
      return this;
    } else if (option === 'hide') {
      mask.hide();
      return this;
    }
  };

})(jQuery);