'use strict';
const fs = require('fs-extra');
const { _ } = require('@cx/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const npminstall = require('npminstall');
const pathExists = require('@cx/path-exists').sync;
const { getNpmLatestVersion } = require('@cx/get-npm-info');

/**
 * npm pacakge 的安装和更新
 * forked from https://github.com/lerna/lerna/blob/main/core/package/index.js
 */
class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package 参数不可为空');
    }

    if (!_.isPlainObject(options)) {
      throw new Error('参数为 Option 对象');
    }

    // package 真实路径
    this.targetPath = options.targetPath;
    // store dir
    this.cachePath = options.cachePath;
    // package name @cx/cli
    this.packageName = options.packageName;
    // package version
    this.packageVersion = options.packageVersion;
    // package的缓存目录前缀
    this.cachePathPrefix = this.packageName.replace('/', '_');
  }

  get cacheFilePath() {
    return path.resolve(this.cachePath, `_${this.cachePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(this.cachePath, `_${this.cachePathPrefix}@${packageVersion}@${this.packageName}`);
  }

  async prepare() {
    if (this.cachePath && !pathExists(this.cachePath)) {
      fs.mkdirpSync(this.cachePath);
      console.log('成功创建缓存文件夹');
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  async exist() {
    if (this.cachePath) {
      // 没有缓存目录的情况：
      // 1. 创建缓存文件 2. 找到这个 pkg 的远程最新版本
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  install() {
    console.log('进来安装');
    return npminstall({
      root: this.targetPath,
      storeDir: this.cachePath,
      pkgs: [{ name: this.packageName, version: this.packageVersion }]
    });
  }

  async update() {
    console.log('进来更新');
    // 远程最新版本
    const latestVersion = await getNpmLatestVersion(this.packageName);
    // 看看远程最新版本是不是存在本地，不存在 -> 下载最新版本
    const latestFilePath = this.getSpecificCacheFilePath(latestVersion);
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.cachePath,
        pkgs: [{ name: this.packageName, version: latestVersion }]
      });

      this.latestVersion = latestVersion;
    }
    this.latestVersion = latestVersion;
  }

  /**
   * 入口 lib main 文件
   * @returns {string} libRootPath
   */
  getFileLibPath() {
    const dir = pkgDir(this.targetPath);
    if (dir) {
      const pkgFile = require(path.resolve(dir, 'package.json'));

      if (pkgFile && pkgFile.main) {
        return path.resolve(dir, pkgFile.main);
      }
    }

    return null;
  }
}

module.exports = Package;
