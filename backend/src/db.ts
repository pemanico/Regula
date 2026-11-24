import oracledb from 'oracledb';

// Modo thick: obrigatório para Native Network Encryption (NNE).
// Tem de ser chamado antes de criar qualquer pool ou ligação.
// Se ORACLE_CLIENT_LIB_DIR não estiver definido, usa a biblioteca do LD_LIBRARY_PATH.
oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_LIB_DIR || undefined,
});

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool: oracledb.Pool | undefined;

export async function initDb(): Promise<void> {
  if (pool) return;
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: Number(process.env.ORACLE_POOL_MIN ?? 2),
    poolMax: Number(process.env.ORACLE_POOL_MAX ?? 10),
    poolIncrement: 1,
    poolTimeout: 60,
    queueTimeout: 5000,
  });
}

// Executa fn numa ligação do pool, com a identidade do utilizador definida.
// O CLIENT_IDENTIFIER é o que as views filtradas por grupo usam (ver docs/arquitetura.md).
// É definido em cada pedido; nunca reutilizar uma ligação sem o redefinir.
export async function withConnection<T>(
  userId: string,
  fn: (conn: oracledb.Connection) => Promise<T>,
): Promise<T> {
  if (!pool) throw new Error('Pool de ligações não inicializado: chamar initDb() primeiro');
  const conn = await pool.getConnection();
  try {
    conn.clientId = userId;
    conn.callTimeout = Number(process.env.ORACLE_CALL_TIMEOUT_MS ?? 10000);
    return await fn(conn);
  } finally {
    await conn.close(); // devolve a ligação ao pool
  }
}

export async function queryRows<T>(
  userId: string,
  sql: string,
  binds: oracledb.BindParameters = {},
): Promise<T[]> {
  return withConnection(userId, async (conn) => {
    const result = await conn.execute<T>(sql, binds, { maxRows: 5000 });
    return result.rows ?? [];
  });
}

export async function closeDb(): Promise<void> {
  if (!pool) return;
  await pool.close(10);
  pool = undefined;
}
