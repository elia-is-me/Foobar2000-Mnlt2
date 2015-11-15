# Foobar2000-UI-Scripts

## 列表: Playlist.js

#### 使用方法:
* 将下列代码粘贴至 Wsh Panel Mod 面板编辑器中:
```
// ==PREPROCESSOR==
// @feature "v1.4"
// @feature "watch-metadb"
// @feature "dragdrop"
// @import "\path\to\common3.js"
// @import "\path\to\Playlist.js"
// ==/PREPROCESSOR==
```
#### 功能：
除了基础的列表操作外还包括或应该包括：
* 歌曲评级
* 封面显示
* 歌曲分组显示
* 等等

#### 快捷键设定:
* **Up**: 
* **Down**:
* **PgUp**: 列表上翻一页
* **PgDn**: 列表下翻一页
* **Home**: 滚动至列表开始
* **End**: 滚动至列表结束
* **Delete**: 从列表删除选中项
* **Return**: 播放
* **F5**: 刷新专辑图片
* **Ctrl-A**: 全选中
* **Ctrl-X**: 剪切
* **Ctrl-C**: 复制
* **Ctrl-V**: 粘贴

##### Vim-style 快捷键设定
* **j**: 同 Up
* **j**: 同 Down
* **h**: 切换到上一播放列表
* **l**: 切换到下一播放列表
* **Ctrl-f**: 同 PgDn
* **Ctrl-b**: 同 PgUp
* **Shift-G(大写G)**: 同 Home
* **gg(连续两次g)**: 同 End

#### 待完成：
##### 近期
* ~~Show cover art~~
* ~~Show playback queue items~~
* ~~Collapse/Expand features~~
* ~~Playlist info viewer~~
* ~~Settings menu~~(or settings panel)
* ~~Keymap settings~~
* ~~Auto group/ungroup based on track\_number/group\_number~~
* ~~Scroll bugfix~~
* ~~Vim-style key bindings~~
* Dragdrop files
* Re-write mouse event

##### 远景
* Save playlist scroll position according to track position rather than item position
* Quick search Media library
* Jump to websites
* Send/recieve messages from other panels
* ~~Add property editing mode~~(废弃)


## 侧边栏: Cover + Playlist Manager.js
* 各种待完成


