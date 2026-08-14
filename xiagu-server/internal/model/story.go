package model

import "time"

type StoryDefinition struct {
	ID          string               `bson:"_id" json:"id"`
	HeroID      string               `bson:"hero_id" json:"hero_id"`
	HeroName    string               `bson:"hero_name" json:"hero_name"`
	Title       string               `bson:"title" json:"title"`
	Subtitle    string               `bson:"subtitle" json:"subtitle"`
	Description string               `bson:"description" json:"description"`
	CoverImage  string               `bson:"cover_image" json:"cover_image"`
	Version     int                  `bson:"version" json:"version"`
	StartNodeID string               `bson:"start_node_id" json:"start_node_id"`
	Chapters    []StoryChapter       `bson:"chapters" json:"chapters"`
	Nodes       map[string]StoryNode `bson:"nodes" json:"nodes"`
	Duration    string               `bson:"total_duration" json:"total_duration"`
	Difficulty  string               `bson:"difficulty" json:"difficulty"`
	Status      string               `bson:"status" json:"status"`
}

type StoryChapter struct {
	ID           string   `bson:"id" json:"id"`
	Title        string   `bson:"title" json:"title"`
	Subtitle     string   `bson:"subtitle" json:"subtitle"`
	LocationName string   `bson:"location_name" json:"location_name"`
	Nodes        []string `bson:"nodes" json:"nodes"`
	Required     bool     `bson:"required" json:"required"`
}

type StoryNode struct {
	ID         string         `bson:"id" json:"id"`
	Type       string         `bson:"type" json:"type"`
	Chapter    string         `bson:"chapter,omitempty" json:"chapter,omitempty"`
	IsKeyNode  bool           `bson:"is_key_node,omitempty" json:"is_key_node,omitempty"`
	Location   map[string]any `bson:"location,omitempty" json:"location,omitempty"`
	Dialog     map[string]any `bson:"dialog,omitempty" json:"dialog,omitempty"`
	NextNodeID string         `bson:"next_node_id,omitempty" json:"next_node_id,omitempty"`
	Choices    []StoryChoice  `bson:"choices,omitempty" json:"choices,omitempty"`
	Reward     *StoryReward   `bson:"reward,omitempty" json:"reward,omitempty"`
	Ending     map[string]any `bson:"ending,omitempty" json:"ending,omitempty"`
	BGM        string         `bson:"bgm,omitempty" json:"bgm,omitempty"`
	BGImage    string         `bson:"bg_image,omitempty" json:"bg_image,omitempty"`
}

type StoryChoice struct {
	ID         string         `bson:"id" json:"id"`
	Text       string         `bson:"text" json:"text"`
	NextNodeID string         `bson:"next_node_id" json:"next_node_id"`
	Condition  map[string]any `bson:"condition,omitempty" json:"condition,omitempty"`
}

type StoryReward struct {
	HeroFragments int          `bson:"hero_fragments" json:"hero_fragments"`
	SkinFragments int          `bson:"skin_fragments" json:"skin_fragments"`
	BondValue     int          `bson:"bond_value" json:"bond_value"`
	Items         []RewardItem `bson:"items,omitempty" json:"items,omitempty"`
}

type StoryProgress struct {
	ID                 string            `bson:"_id" json:"id"`
	UserID             string            `bson:"user_id" json:"user_id"`
	StoryID            string            `bson:"story_id" json:"story_id"`
	HeroID             string            `bson:"hero_id" json:"hero_id"`
	Mode               string            `bson:"mode" json:"mode"`
	CurrentNodeID      string            `bson:"current_node_id" json:"current_node_id"`
	CompletedNodes     []string          `bson:"completed_nodes" json:"completed_nodes"`
	ClaimedRewardNodes []string          `bson:"claimed_reward_nodes" json:"claimed_reward_nodes"`
	Choices            map[string]string `bson:"choices" json:"choices"`
	Status             string            `bson:"status" json:"status"`
	Revision           int64             `bson:"revision" json:"revision"`
	StoryVersion       int               `bson:"story_version" json:"story_version"`
	StartedAt          time.Time         `bson:"started_at" json:"started_at"`
	UpdatedAt          time.Time         `bson:"updated_at" json:"updated_at"`
	CompletedAt        *time.Time        `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
}
