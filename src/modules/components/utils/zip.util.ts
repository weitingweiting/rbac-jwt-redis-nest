import AdmZip from 'adm-zip'

/**
 * ZIP 文件处理工具类
 */
export class ZipUtil {
  /**
   * 过滤掉 macOS 系统文件
   */
  static filterSystemFiles(entries: AdmZip.IZipEntry[]): AdmZip.IZipEntry[] {
    return entries.filter((entry) => {
      const name = entry.entryName
      // 过滤 macOS 系统文件和目录
      return (
        !name.startsWith('__MACOSX/') &&
        !name.includes('.DS_Store') &&
        !name.startsWith('._') &&
        !entry.isDirectory // 同时过滤目录项
      )
    })
  }

  /**
   * 解包 ZIP 文件并返回过滤后的文件列表
   */
  static getCleanEntries(zipBuffer: Buffer): AdmZip.IZipEntry[] {
    const zip = new AdmZip(zipBuffer)
    const allEntries = zip.getEntries()
    return this.filterSystemFiles(allEntries)
  }

  /**
   * 解包 ZIP 文件并移除第一层目录前缀
   * 例如：dist/index.js -> index.js, dist/assets/icon.png -> assets/icon.png
   */
  static getCleanEntriesWithoutPrefix(zipBuffer: Buffer): Array<{
    originalPath: string
    cleanPath: string
    entry: AdmZip.IZipEntry
  }> {
    const entries = this.getCleanEntries(zipBuffer)

    return entries.map((entry) => {
      const originalPath = entry.entryName
      // 移除第一个 / 之前的所有内容（包括 /）
      const firstSlashIndex = originalPath.indexOf('/')
      const cleanPath =
        firstSlashIndex !== -1 ? originalPath.substring(firstSlashIndex + 1) : originalPath

      return {
        originalPath,
        cleanPath,
        entry
      }
    })
  }

  /**
   * 查找 component.meta.json 文件（支持根目录或子目录）
   */
  static findMetaEntry(entries: AdmZip.IZipEntry[]): AdmZip.IZipEntry | undefined {
    return entries.find((entry) => {
      return (
        entry.entryName === 'component.meta.json' ||
        entry.entryName.endsWith('/component.meta.json')
      )
    })
  }

  /**
   * 查找 component.meta.supplement.json 文件（支持根目录或子目录）
   */
  static findSupplementEntry(entries: AdmZip.IZipEntry[]): AdmZip.IZipEntry | undefined {
    return entries.find((entry) => {
      return (
        entry.entryName === 'component.meta.supplement.json' ||
        entry.entryName.endsWith('/component.meta.supplement.json')
      )
    })
  }

  /**
   * 检查文件是否存在（支持精确匹配或文件名匹配）
   */
  static fileExists(fileNames: string[], targetPath: string): boolean {
    // 1. 精确匹配完整路径
    if (fileNames.includes(targetPath)) {
      return true
    }

    // 2. 匹配文件名结尾（处理 meta.json 可能在子目录的情况）
    return fileNames.some((fileName) => fileName.endsWith(targetPath))
  }

  /**
   * 获取 ZIP 文件列表（过滤系统文件后）
   */
  static getFileList(zipBuffer: Buffer): string[] {
    const entries = this.getCleanEntries(zipBuffer)
    return entries.map((entry) => entry.entryName)
  }

  /**
   * 计算 ZIP 文件总大小（过滤系统文件后）
   */
  static calculateSize(zipBuffer: Buffer): number {
    const entries = this.getCleanEntries(zipBuffer)
    return entries.reduce((total, entry) => total + entry.header.size, 0)
  }
}
