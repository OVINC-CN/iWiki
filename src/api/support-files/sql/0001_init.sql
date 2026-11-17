-- 空库初始化脚本；执行前确认目标数据库为空。
-- 数据库字符集使用 utf8mb4，表间关联由应用事务维护。

CREATE TABLE account_user (
    username VARCHAR(32) NOT NULL COMMENT '用户名',
    password VARCHAR(128) NOT NULL COMMENT '不可用口令标记',
    last_login DATETIME(6) NULL COMMENT '最近登录时间，UTC',
    is_superuser TINYINT(1) NOT NULL COMMENT '管理员标记',
    is_deleted TINYINT(1) NOT NULL COMMENT '账号删除标记',
    nick_name VARCHAR(32) NULL COMMENT '昵称',
    user_type VARCHAR(32) NOT NULL COMMENT '账号类型',
    date_joined DATETIME(6) NOT NULL COMMENT '注册时间，UTC',
    is_staff TINYINT(1) NOT NULL COMMENT '后台访问标记',
    PRIMARY KEY (username),
    KEY idx_account_user_deleted (is_deleted)
) ENGINE=InnoDB;

CREATE TABLE doc_doc (
    id VARCHAR(32) NOT NULL COMMENT '文档编号',
    title LONGTEXT NOT NULL COMMENT '文档标题',
    content LONGTEXT NOT NULL COMMENT 'Markdown 正文',
    header_img LONGTEXT NULL COMMENT '封面地址',
    is_public TINYINT(1) NOT NULL COMMENT '是否向其他登录用户公开',
    pv BIGINT NOT NULL COMMENT '阅读量',
    owner_id VARCHAR(32) NOT NULL COMMENT '作者用户名',
    updated_at DATETIME(6) NOT NULL COMMENT '更新时间，UTC',
    created_at DATETIME(6) NOT NULL COMMENT '创建时间，UTC',
    PRIMARY KEY (id),
    KEY idx_doc_owner (owner_id),
    KEY idx_doc_public (is_public),
    KEY idx_doc_pv (pv),
    KEY idx_doc_updated (updated_at),
    KEY idx_doc_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE doc_docbin (
    id VARCHAR(32) NOT NULL COMMENT '原文档编号',
    title LONGTEXT NOT NULL COMMENT '原文档标题',
    content LONGTEXT NOT NULL COMMENT '原文档正文',
    header_img LONGTEXT NULL COMMENT '原封面地址',
    is_public TINYINT(1) NOT NULL COMMENT '原可见性',
    pv BIGINT NOT NULL COMMENT '原阅读量',
    owner_id VARCHAR(32) NOT NULL COMMENT '原作者用户名',
    updated_at DATETIME(6) NOT NULL COMMENT '原更新时间，UTC',
    created_at DATETIME(6) NOT NULL COMMENT '原创建时间，UTC',
    deleted_at DATETIME(6) NOT NULL COMMENT '删除时间，UTC',
    PRIMARY KEY (id),
    KEY idx_docbin_owner (owner_id),
    KEY idx_docbin_public (is_public),
    KEY idx_docbin_pv (pv),
    KEY idx_docbin_updated (updated_at),
    KEY idx_docbin_created (created_at),
    KEY idx_docbin_deleted (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE doc_tag (
    id VARCHAR(32) NOT NULL COMMENT '标签编号',
    name VARCHAR(32) NOT NULL COMMENT '标签名称',
    created_at DATETIME(6) NOT NULL COMMENT '创建时间，UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uk_tag_name (name),
    KEY idx_tag_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE doc_doctag (
    id VARCHAR(32) NOT NULL COMMENT '关系编号',
    doc_id VARCHAR(32) NOT NULL COMMENT '文档编号',
    tag_id VARCHAR(32) NOT NULL COMMENT '标签编号',
    created_at DATETIME(6) NOT NULL COMMENT '创建时间，UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uk_doctag_doc_tag (doc_id, tag_id),
    KEY idx_doctag_tag (tag_id),
    KEY idx_doctag_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE doc_comment (
    id VARCHAR(32) NOT NULL COMMENT '评论编号',
    doc_id VARCHAR(32) NOT NULL COMMENT '文档编号',
    content LONGTEXT NOT NULL COMMENT '评论正文',
    owner_id VARCHAR(32) NOT NULL COMMENT '评论者用户名',
    updated_at DATETIME(6) NOT NULL COMMENT '更新时间，UTC',
    created_at DATETIME(6) NOT NULL COMMENT '创建时间，UTC',
    PRIMARY KEY (id),
    KEY idx_comment_doc (doc_id),
    KEY idx_comment_owner (owner_id),
    KEY idx_comment_updated (updated_at),
    KEY idx_comment_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE doc_commentbin (
    id VARCHAR(32) NOT NULL COMMENT '原评论编号',
    doc_id VARCHAR(32) NOT NULL COMMENT '原文档编号',
    content LONGTEXT NOT NULL COMMENT '原评论正文',
    owner_id VARCHAR(32) NOT NULL COMMENT '原评论者用户名',
    updated_at DATETIME(6) NOT NULL COMMENT '原更新时间，UTC',
    created_at DATETIME(6) NOT NULL COMMENT '原创建时间，UTC',
    deleted_at DATETIME(6) NOT NULL COMMENT '删除时间，UTC',
    PRIMARY KEY (id),
    KEY idx_commentbin_doc (doc_id),
    KEY idx_commentbin_owner (owner_id),
    KEY idx_commentbin_updated (updated_at),
    KEY idx_commentbin_created (created_at),
    KEY idx_commentbin_deleted (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE permission_userpermission (
    id VARCHAR(32) NOT NULL COMMENT '授权编号',
    user_id VARCHAR(32) NOT NULL COMMENT '用户名',
    permission_item VARCHAR(32) NOT NULL COMMENT 'create_doc 或 upload_file',
    expired_at DATETIME(6) NULL COMMENT '失效时间，空值为长期授权',
    authed_at DATETIME(6) NOT NULL COMMENT '授权时间，UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uk_permission_user_item (user_id, permission_item),
    KEY idx_permission_user_expired (user_id, expired_at),
    KEY idx_permission_user_item_expired (user_id, permission_item, expired_at)
) ENGINE=InnoDB;

CREATE TABLE cos_coslog (
    id VARCHAR(32) NOT NULL COMMENT '上传记录编号',
    filename VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `key` VARCHAR(255) NOT NULL COMMENT '对象键',
    resp JSON NULL COMMENT '脱敏签发状态，禁止保存临时密钥',
    owner_id VARCHAR(32) NOT NULL COMMENT '申请者用户名',
    uploaded_at DATETIME(6) NOT NULL COMMENT '申请时间，UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cos_key (`key`),
    KEY idx_cos_owner (owner_id),
    KEY idx_cos_uploaded (uploaded_at)
) ENGINE=InnoDB;
