# Technical Plan

## import-folder

增量扫描基于目录快照比较：

- 读取当前文件路径、大小、修改时间。
- 与已有索引快照比较。
- 生成 added、updated、missing、failed 四类结果。
- 不在本切片中做实时文件监听。
