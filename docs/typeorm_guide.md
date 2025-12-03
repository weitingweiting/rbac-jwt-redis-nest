# TypeORM 使用手册：Repository 与 QueryBuilder

---

## 🧱 Repository 模式速查表

| 方法                                | 作用              | 说明                         | 使用示例                                                                 | 解释                               |
| ----------------------------------- | ----------------- | ---------------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| `find(options?)`                    | 查询多条数据      | 可带 where、order、relations | `await repo.find({ where: { isActive: true }, relations: ['profile'] })` | 自动生成 SELECT 查询，返回实体数组 |
| `findBy(where)`                     | 按条件查询        | 更简洁的 find 版本           | `await repo.findBy({ name: Like('%Tom%') })`                             | 仅支持 where 条件，省略其他配置    |
| `findOne(options)`                  | 查询单条          | 常用于主键或唯一值           | `await repo.findOne({ where: { id: 1 } })`                               | 若无结果返回 undefined             |
| `findOneBy(where)`                  | 简化 findOne      | 仅传 where 条件              | `await repo.findOneBy({ email: 'a@b.com' })`                             | 内部执行 LIMIT 1 查询              |
| `findAndCount()`                    | 查询并返回总数    | 分页常用                     | `const [list, count] = await repo.findAndCount()`                        | 会执行两次 SQL（SELECT + COUNT）   |
| `count(options?)`                   | 统计记录数量      | 类似 SQL COUNT               | `await repo.count({ where: { isActive: true } })`                        | 返回整数总数                       |
| `exist(options?)`                   | 判断是否存在      | v0.3+ 新增                   | `await repo.exist({ where: { id: 1 } })`                                 | 返回布尔值，不加载数据             |
| `create(data)`                      | 创建新实体        | 不入库，仅实例化             | `const user = repo.create({ name: 'Tom' })`                              | 可用于校验、再 save                |
| `save(entity)`                      | 插入或更新        | ORM 自动判断 INSERT/UPDATE   | `await repo.save({ id: 1, name: 'Bob' })`                                | 若含主键则更新，否则插入           |
| `insert(data)`                      | 执行插入          | 直接执行 SQL                 | `await repo.insert({ name: 'Alice' })`                                   | 性能高，不会返回实体               |
| `update(criteria, data)`            | 更新记录          | 条件更新                     | `await repo.update({ id: 1 }, { name: 'Tom' })`                          | 不会加载实体                       |
| `upsert(data, conflict)`            | 插入或更新        | 冲突即更新                   | `await repo.upsert({ id: 1, name: 'T' }, ['id'])`                        | PostgreSQL/MySQL 支持              |
| `delete(criteria)`                  | 删除记录          | 条件删除                     | `await repo.delete({ id: 1 })`                                           | 真删除                             |
| `remove(entity)`                    | 删除实体          | 删除单个实例                 | `await repo.remove(user)`                                                | 需为实体对象                       |
| `softDelete(criteria)`              | 软删除            | 设置 deletedAt               | `await repo.softDelete({ id: 1 })`                                       | 实际不删除                         |
| `restore(criteria)`                 | 恢复软删除        | 清空 deletedAt               | `await repo.restore({ id: 1 })`                                          | 反向操作                           |
| `increment(criteria, field, value)` | 字段自增          | 常用于计数                   | `await repo.increment({ id: 1 }, 'views', 1)`                            | 直接执行 UPDATE                    |
| `decrement(criteria, field, value)` | 字段自减          | 常用于库存                   | `await repo.decrement({ id: 1 }, 'stock', 1)`                            | 类似 increment                     |
| `clear()`                           | 清空表            | 删除所有数据                 | `await repo.clear()`                                                     | 慎用，会 TRUNCATE 表               |
| `createQueryBuilder(alias?)`        | 获取 QueryBuilder | 进入高级查询模式             | `repo.createQueryBuilder('u')`                                           | 构建复杂 SQL                       |
| `query(sql, params?)`               | 执行原生 SQL      | 原始查询                     | `await repo.query('SELECT * FROM user')`                                 | 返回原始结果                       |

---

## ⚔️ QueryBuilder 模式速查表

| 方法                        | 作用              | 说明              | 使用示例                                                 | 解释                 |
| --------------------------- | ----------------- | ----------------- | -------------------------------------------------------- | -------------------- |
| `select(fields)`            | 选择字段          | 指定列或别名      | `.select(['user.id', 'user.name'])`                      | 对应 SELECT 子句     |
| `addSelect(fields)`         | 追加字段          | 不覆盖已有 select | `.addSelect('profile.age')`                              | 用于动态拼接         |
| `distinct()`                | 去重              | SELECT DISTINCT   | `.distinct(true)`                                        | 避免重复记录         |
| `from(entity, alias)`       | 指定表            | 通常自动生成      | `.from(User, 'user')`                                    | 明确主查询实体       |
| `where(cond, params?)`      | 添加 WHERE        | 设置条件          | `.where('user.age > :age', { age: 18 })`                 | 创建过滤条件         |
| `andWhere(cond, params?)`   | 追加 AND          | 与 where 组合     | `.andWhere('user.isActive = :active', { active: true })` | 拼接条件             |
| `orWhere(cond, params?)`    | 追加 OR           | 或逻辑            | `.orWhere('user.name LIKE :kw', { kw: '%Tom%' })`        | 多条件搜索           |
| `leftJoin(property, alias)` | 左连接            | 不自动 select     | `.leftJoin('user.profile', 'profile')`                   | 对应 LEFT JOIN       |
| `leftJoinAndSelect()`       | 左连接并选取      | 自动带出字段      | `.leftJoinAndSelect('user.profile', 'profile')`          | 最常用 JOIN          |
| `innerJoin()`               | 内连接            | 过滤无关联项      | `.innerJoin('user.profile', 'p')`                        | INNER JOIN 语义      |
| `innerJoinAndSelect()`      | 内连并选取        | 同上              | `.innerJoinAndSelect('user.profile', 'p')`               | 返回匹配数据         |
| `groupBy(columns)`          | 分组              | GROUP BY          | `.groupBy('user.country')`                               | 聚合统计             |
| `addGroupBy()`              | 追加分组          | 多字段分组        | `.addGroupBy('user.city')`                               | 常配合 COUNT、SUM    |
| `having(cond, params?)`     | 分组过滤          | HAVING 子句       | `.having('COUNT(user.id) > 5')`                          | 聚合过滤             |
| `orderBy(column, order)`    | 排序              | ORDER BY          | `.orderBy('user.createdAt', 'DESC')`                     | 可链式调用           |
| `addOrderBy()`              | 追加排序          | 多字段排序        | `.addOrderBy('profile.age', 'ASC')`                      |                      |
| `limit(n)`                  | 限制数量          | LIMIT             | `.limit(10)`                                             | MySQL/PG 有效        |
| `offset(n)`                 | 偏移量            | OFFSET            | `.offset(0)`                                             | 用于分页             |
| `take(n)`                   | ORM 分页          | 与 limit 等价     | `.take(10)`                                              | 推荐跨库写法         |
| `skip(n)`                   | ORM 偏移          | 与 offset 等价    | `.skip(0)`                                               | 推荐跨库写法         |
| `insert()`                  | 插入模式          | INSERT INTO       | `.insert().into(User)`                                   | 进入 DML 模式        |
| `values(data)`              | 插入数据          | 多条批量          | `.values([{name:'A'},{name:'B'}])`                       | 结合 insert 使用     |
| `update()`                  | 更新模式          | UPDATE            | `.update(User).set({active:false})`                      | 修改数据             |
| `set(values)`               | 设置更新字段      | SET 子句          | `.set({ name: 'Tom' })`                                  |                      |
| `delete()`                  | 删除模式          | DELETE            | `.delete().from(User)`                                   | 批量删除             |
| `returning(cols)`           | 返回列            | RETURNING         | `.returning('*')`                                        | PG 特有              |
| `subQuery()`                | 子查询            | 嵌套 SELECT       | `.subQuery().select('id').from(User,'u')`                | 生成子语句           |
| `getQuery()`                | 输出 SQL          | 调试              | `.getQuery()`                                            | 返回 SQL 字符串      |
| `getRawMany()`              | 执行原始查询      | 返回原始行        | `.getRawMany()`                                          | 不映射实体           |
| `getMany()`                 | 执行查询          | 返回实体数组      | `.getMany()`                                             | 自动映射实体         |
| `getOne()`                  | 返回单条实体      | LIMIT 1           | `.getOne()`                                              | 无结果返回 undefined |
| `getCount()`                | 返回数量          | COUNT             | `.getCount()`                                            | 快速计数             |
| `getManyAndCount()`         | 查询 + 总数       | 两次 SQL          | `.getManyAndCount()`                                     | 分页常用             |
| `execute()`                 | 执行 SQL          | 插入/更新/删除    | `.execute()`                                             | 返回执行信息         |
| `setParameter(key,val)`     | 设置参数          | 动态绑定          | `.setParameter('id',1)`                                  | 防 SQL 注入          |
| `setParameters(obj)`        | 批量参数          | —                 | `.setParameters({a:1,b:2})`                              | 同上                 |
| `cache(msOrId)`             | 缓存结果          | 性能优化          | `.cache(60000)`                                          | 单位毫秒             |
| `clone()`                   | 克隆 QueryBuilder | 复用结构          | `.clone()`                                               | 多用途拼接           |
| `printSql()`                | 打印 SQL          | 调试方便          | `.printSql()`                                            | 输出控制台           |

---

## 🧠 Repository vs QueryBuilder 区别

| 对比项   | Repository     | QueryBuilder              |
| -------- | -------------- | ------------------------- |
| 语法风格 | 声明式（对象） | 命令式（SQL 构造）        |
| 使用难度 | 简单           | 较高                      |
| 灵活性   | 一般           | 极高，可构造任意 SQL      |
| 典型场景 | CRUD、简单筛选 | 多表 JOIN、聚合、动态条件 |
| 返回类型 | 自动映射实体   | 可选映射 / 原始行         |
| 性能优化 | 较少控制       | 精细可调（索引、分页）    |
| 学习建议 | 初学入门       | 进阶与性能优化必备        |

---

## 🧾 推荐实践

- 初级阶段优先使用 **Repository API**，便于维护。
- 当遇到：
  - 多表关联查询、聚合统计、分页搜索、动态筛选时 → 使用 **QueryBuilder**。
- 熟练使用 `.getQueryAndParameters()` 调试 SQL。
- 封装通用分页函数，提高可复用性。

---

> 🪶 Author: Grimoire, GPTavern Code Wizard
> 用魔法理解 SQL，用理性掌控数据库。
