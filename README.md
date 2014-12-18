#mdtable
=======

##中文版本
在项目开发中使用的自定义的表格组件，支持远程和本地2种方式请求数据。[点击查看示例](http://nccun.github.io/mdtable/)

###一些说明
1. 项目中使用的bootstrap并非必须，只是为了更快布局使用
2. plugins.js中附带了loading和checkbox的自定义插件，如果不需要可以删除，但是mdtable中的一些实现使用到了，所以这部分也得做相应改变
3. 可以自行修改插件（js和css）以满足自己项目的需求
4. 现在插件还有很多功能尚在完善，欢迎大家提出指正

###功能
* 远程/本地请求数据
* 排序
* 搜索
* 行/列渲染
* 分页（非完全开发）

###已知问题
1. 分页组件只做了简单实现，没有做首页和尾页以及页数较多时的处理
2. 如果排序的2行数据相同，可能会出现不同的排序结果

###使用方法
1. 引入plugins.css、jquery.js、plugins.js
2. 页面加载完成后执行 ``$mdtable = $('table').mdtable(options)`` 即可，options配置参考下面。

###options配置

```javascript
url: 'data/data.json',
extra: {id: 'xxx'},
multicheck: {enable: true},
columns: [
  {
    class:"name text-center",
    row:'name'
  }, {
    class:"height",
    row:'height',
    renderer: function(value) {
      return value + 'cm';
    },
    sort: {
      enable: true
    }
  }, {
    class:"weight",
    row:'weight',
    renderer: function(value) {
      var r = $('<div>' + value + '</div>');
      r.hover(function(){
        r.text(r.text()+'kg').css('color','#f90');
      }, function(){
        r.text(r.text().substring(0, r.text().length -2)).css('color','#000');
      });
      return r;
    },
    sort: {
      enable: true,
      default: 'asc',
      rule: function(a, b) {
        return a.text() > b.text();
      }
    }
  }, {
    class:"age",
    row:'age'
  }
],
  trRenderer: function(row) {
  console.log(row);
}
```

###方法
用法: ``$mdtable.methodName(params)``

- load(params)
- loadData(params)
- addData(datas)
- getDatas()
- getSelection()

###事件
用法: ``$mdtable.on('eventName', function(){})``
- select.change
- page.change


##Englise version

Custom table in our project, it support remote and local method to get data. [Demo Here](http://nccun.github.io/mdtable/)
*If there's any translation problom, please contact me [mailto:erguotou525@gmail.com](mailto:erguotou525@gmail.com)*

###Some description
1. The bootstrap is not necessary, just to layout quickly
2. There're loading and checkbox plugins in the 'plugins.js' file, if it's not needed, you can delete it. But this plugin use them to layout, so you need to modify them yourselef.
3. You can change js or css files to suit your project's demand.
4. Now time, there're some function still need improving, so it's very glad to receive your pull request.

###Features
* Remote and local way to get datas
* Sort
* Search
* Row and column renderer
* Pagination (not well developed)

###Known Issues
1. Pagination widget is not well developed, no first page, no last page, and not handle the situation of many pages.
2. If there are 2 rows with the same data, it may performance different sorting result.

###Usage
1. Import the plugins.css and jquery.js and plugins.js.
2. When page loaded, run the next code ``$mdtable = $('table').mdtable(options)`` , options below。

###Options

```javascript
url: 'data/data.json',
extra: {id: 'xxx'},
multicheck: {enable: true},
columns: [
  {
    class:"name text-center",
    row:'name'
  }, {
    class:"height",
    row:'height',
    renderer: function(value) {
      return value + 'cm';
    },
    sort: {
      enable: true
    }
  }, {
    class:"weight",
    row:'weight',
    renderer: function(value) {
      var r = $('<div>' + value + '</div>');
      r.hover(function(){
        r.text(r.text()+'kg').css('color','#f90');
      }, function(){
        r.text(r.text().substring(0, r.text().length -2)).css('color','#000');
      });
      return r;
    },
    sort: {
      enable: true,
      default: 'asc',
      rule: function(a, b) {
        return a.text() > b.text();
      }
    }
  }, {
    class:"age",
    row:'age'
  }
],
  trRenderer: function(row) {
  console.log(row);
}
```

###Methods
Usage: ``$mdtable.methodName(params)``

- load(params)
- loadData(params)
- addData(datas)
- getDatas()
- getSelection()

###Events
Usage: ``$mdtable.on('eventName', function(){})``
- select.change
- page.change
