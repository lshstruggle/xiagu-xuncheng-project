package database

import "go.mongodb.org/mongo-driver/mongo"

// Collections 为 MongoDB 集合名称统一添加环境前缀。
type Collections struct {
	database *mongo.Database
	prefix   string
}

// NewCollections 创建统一的集合访问器。
func NewCollections(
	database *mongo.Database,
	prefix string,
) *Collections {
	return &Collections{
		database: database,
		prefix:   prefix,
	}
}

// Collection 根据逻辑集合名称返回实际 MongoDB 集合。
func (c *Collections) Collection(name string) *mongo.Collection {
	return c.database.Collection(CollectionName(c.prefix, name))
}

// CollectionName 根据环境前缀生成实际集合名称。
func CollectionName(prefix string, name string) string {
	return prefix + name
}
