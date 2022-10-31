# Linearite

让你的编码过程更加的线性，一个用于解决 monorepo 下的软件包构建发布管理工具。

## 功能

* [ ] 支持多种 builder 的软件包构建
  * [ ] 支持多种类型 builder
    * [ ] esbuild
    * [ ] swc
  * [ ] 统一配置
* [ ] 基于 monorepo 的软件包管理
  * [ ] 支持多种类型 monorepo
    * [ ] yarn workspace
    * [ ] pnpm workspace
    * [ ] lerna
  * [ ] 统一配置
  * [ ] 统一发布
    * [ ] 自动提交，打标签，发布(如果正在使用 git 进行版本管理)
    * [ ] 通过触发 hook，联动 builder 进行构建
  * [ ] 版本管理
* [ ] 简单对 commit message 的规范化
