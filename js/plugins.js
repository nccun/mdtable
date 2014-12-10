(function($){
  /**
   * custom table width sorting and pagination
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
      paging: '<nav class="pull-right"><ul class="pagination"><li class="first hidden"><a class="disabled" data-page="f">' + option.paging.firstText 
        + '</a></li><li class="pre"><a class="disabled" data-page="p">' + option.paging.preText + '</a></li><li class="page"><a data-page="1">1</a></li><li class="next"><a class="disabled" data-page="n">' 
        + option.paging.nextText + '</a></li><li class="last hidden"><a class="disabled" data-page="l">' + option.paging.lastText + '</a></li></ul></nav>'
    };

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
          if (col.sort.rule) {
            thCol.data('rule', col.sort.rule);
          }
        } else {
          thCol.addClass('sorting');
        }
        thCol.on('click', function(){
          var $this = $(this),
            $index = th.find('th:not(.check)').index($this),
            $rule = $this.data('rule');
          if ($this.hasClass('sorting_desc')) {
            doSort($index, 'asc', $rule);
            $this.removeClass('sorting_desc').addClass('sorting_asc');
          } else {
            doSort($index, 'desc', $rule);
            $this.removeClass('sorting sorting_asc').addClass('sorting_desc');
          }
          $this.siblings().filter('.sorting,.sorting_asc,.sorting_desc').removeClass('sorting_asc sorting_desc').addClass('sorting');
        });
      }
    }
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
    })
    // paginations' click event(not disabled and not current page)
    // 分页组件(非禁用、非当前按钮)的点击事件
    pagDom.delegate('li a:not(.disabled,.active)', 'click', function(){
      var $this = $(this), $parent = $this.parent(), targetPage = $this.data('page');
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
      load(_extra);
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
     * @param col column index to sort
     * @param order 排序的顺序，默认升序
     * @param order the order to sort, default is 'asc'
     * @param rule 排序规则，默认按本地语言文字的排序方法排序
     * @param rule sort rule, default is 'localeCompare'
     */
    var doSort = function(col, order , rule) {
      if (col != 0 && !col) return;
      if (rule = null) {rule = order;order = null};
      if (!order) order = 'asc';
      // 不能执行tb.empty()清空，否则dom上的事件不能保存
      tb.append(tb.children().sort(function(a, b){
        a = $(a).find('td:not(.check)').eq(col), b = $(b).find('td:not(.check)').eq(col);
        if (rule && typeof  rule === 'function') {
          return rule(a, b) * (order === 'desc'?-1:1);
        } else {
          return a.text().localeCompare(b.text()) * (order === 'desc'?-1:1);
        }
      }));
    };

    /**
     * 请求资源
     * ajax load data
     * @param extra 请求时发送的数据
     * @param extra ajax data parameter
     */
    var load = function(extra) {
      var data = $.extend({}, extra, {start:start, limit: limit});
      _extra = extra?extra:_extra;
      $.load({
        url: (extra && extra.url)?extra.url:option.url,
        data: data,
        target: tableWrap,
        cache: option.cache?option.cache:false,
        success: function(data) {
          loadData(data);
        },
        error: function(xhr, status){
          if (status === 'timeout') {
            tb.empty().append(template.timeout);
          } else {
            tb.empty().append(template.error);
          }
          table.trigger('load.error');
        }
      });
    }

    /**
     * 让表格加载数据
     * renderer the data to the table
     * @param data 格式:{count:xx,data:[{},{},...]}
     * @param data like:{count:xx,data:[{},{},...]}
     */
    var loadData = function(data) {
      if (data.data) {
        // clear table
        // 先清空table内容
        tb.empty();
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
          pagDom.hide()
        }
        data = data.data;
        if (data.length) {
          if (data.length > limit) {
            // prevent that data.length gt limit
            // 防止返回数据条数大于每页显示数
            data.length = limit;
          }
          // insert datas
          // 循环插入数据
          for(var i = 0; i < data.length; i++) {
            var tr = $('<tr></tr>').addClass(i % 2 == 0 ? 'odd': 'even');
            // insert checkbox
            // 插入多选框
            if (option.multicheck.enable) {
              tr.append(template.checkbox.td);
            }
            // insert columns
            // 循环插入列值
            for(var j = 0; j < option.columns.length; j++) {
              var col = option.columns[j];
              var v = data[i][col.row];
              // column renderer
              // 列渲染
              if (col.renderer && typeof col.renderer === 'function') {
                v = col.renderer(v, data[i], data);
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
            tr.data('row', data[i]);
            tb.append(tr);
          }
          if (_sortingCol != -1) {
            var $c = th.find('th').eq(_sortingCol),
              _order = null;
            if ($c.hasClass('sorting_desc')) {
              _order = 'desc';
            } else {
              _order = 'asc';
            }
            doSort(_sortingCol, _order, $c.data('rule'));
          }
        } else {
          tb.empty().append(template.empty);
        }
      } else {
        tb.empty().append(template.error);
      }
      table.trigger('load.ok');
    }

    // load data for the first time
    // 首次请求数据
    if (option.url) {
      load(option.extra);
    } else if (option.data) {
      loadData(option.data);
    }
    // public method load with a parameter 'extra',
    // load data with ajax and the extra parameter
    // 添加额外数据进行查询，查询条件添加到ajax请求中
    this.load = function(extra) {
      start = 0;
      load(extra);
    };
    //public method loadData with a parameter 'data'
    // load data with the giving data
    this.loadData = function(data) {
      start = 0;
      loadData(data);
    }
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
      option.beforeSend = function() {
        target.loading('show');
      };
      option.complete = function() {
        target.loading('hide');
      };
      $.ajax(option);
    },
    loadDefaults: {
      type: 'get',
      timeout: 6000,
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
  }

  /**
   * custom loading method, parameter is 'show' or 'hide'
   * loading,参数show|hide
   */
  $.fn.loading = function(option) {
  	option = option||'show';
  	var mask = $('.md-mask').eq(parseInt(this.attr('data-loading') - 1));
  	if (mask.length == 0) {
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