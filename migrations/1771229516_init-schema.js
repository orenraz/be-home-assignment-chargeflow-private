exports.up = (pgm) => {
  pgm.createTable("events", {
    id: "id",
    event_id: { type: "text", notNull: true, unique: true },
    topic: { type: "text", notNull: true },
    partition: { type: "int" },
    offset: { type: "bigint" },
    occurred_at: { type: "timestamptz" },
    received_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    merchant_id: { type: "text" },
    order_id: { type: "text" },
    payload: { type: "jsonb", notNull: true },
  });

  pgm.createIndex("events", ["merchant_id", "order_id"]);
  pgm.createIndex("events", ["occurred_at"]);

  pgm.createTable(
    "order_snapshot",
    {
      merchant_id: { type: "text", notNull: true },
      order_id: { type: "text", notNull: true },

      order_data: { type: "jsonb" },
      order_occurred_at: { type: "timestamptz" },

      payment_data: { type: "jsonb" },
      payment_occurred_at: { type: "timestamptz" },

      dispute_data: { type: "jsonb" },
      dispute_occurred_at: { type: "timestamptz" },

      updated_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("now()"),
      },
    },
    {
      constraints: {
        primaryKey: ["merchant_id", "order_id"],
      },
    }
  );

  pgm.createTable(
    "risk_scores",
    {
      merchant_id: { type: "text", notNull: true },
      order_id: { type: "text", notNull: true },

      score: { type: "int", notNull: true },
      signals: {
        type: "jsonb",
        notNull: true,
        default: "{}",
      },

      computed_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("now()"),
      },
      expires_at: { type: "timestamptz", notNull: true },
    },
    {
      constraints: {
        primaryKey: ["merchant_id", "order_id"],
      },
    }
  );

  pgm.createIndex("risk_scores", ["expires_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("risk_scores");
  pgm.dropTable("order_snapshot");
  pgm.dropTable("events");
};
