import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { Client } from 'pg';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let client: Client | null = null;

  try {
    const { action, query, host, port, database, username, password, ssl, tableName, page = 1, pageSize = 100, fetchAll = false } = await request.json();

    if (!host || !database || !username || !password || !port) {
      return new ChatSDKError(
        'bad_request:api',
        'Connection parameters are required.',
      ).toResponse();
    }

    // Validate Supabase hostname format
    if (host.includes('supabase.co')) {
      // Accept both standard Supabase format and regional pooler format
      const standardSupabasePattern = /^db\.[a-zA-Z0-9-]+\.supabase\.co$/;
      const poolerSupabasePattern = /^[a-zA-Z0-9-]+-[0-9]+-[a-zA-Z0-9-]+\.pooler\.supabase\.com$/;
      
      if (!standardSupabasePattern.test(host) && !poolerSupabasePattern.test(host)) {
        return new ChatSDKError(
          'bad_request:database',
          `Invalid Supabase hostname format: ${host}. Expected format: db.your-project-ref.supabase.co or region-pooler.supabase.com`,
        ).toResponse();
      }
    }

    // Create PostgreSQL client with provided connection parameters
    // For Supabase, we need to handle SSL differently
    let connectionString;
    let clientConfig;
    
    if (host.includes('supabase.com')) {
      // For Supabase, use a simpler connection string and configure SSL separately
      connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      clientConfig = {
        connectionString,
        connectionTimeoutMillis: 10000,
        ssl: {
          rejectUnauthorized: false,
        }
      };
    } else {
      // For other databases, use the standard approach
      connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=${ssl ? 'require' : 'disable'}`;
      clientConfig = {
        connectionString,
        connectionTimeoutMillis: 10000,
      };
    }
    
    // Try alternative hostname if the original fails
    let alternativeHost = host;
    if (host.includes('supabase.co') && !host.includes('pooler.supabase.com')) {
      alternativeHost = host.replace('supabase.co', 'pooler.supabase.com');
    }
    
    client = new Client(clientConfig);

    // Connect to the database
    try {
      await client.connect();
    } catch (connectError) {
      
      // Try alternative hostname if available
      if (alternativeHost !== host) {
                 await client.end();
         
         // Configure alternative connection with proper SSL handling
         let alternativeConnectionString;
         let alternativeClientConfig;
         
         if (alternativeHost.includes('supabase.com')) {
           alternativeConnectionString = `postgresql://${username}:${password}@${alternativeHost}:${port}/${database}`;
           alternativeClientConfig = {
             connectionString: alternativeConnectionString,
             connectionTimeoutMillis: 10000,
             ssl: {
               rejectUnauthorized: false,
             }
           };
         } else {
           alternativeConnectionString = `postgresql://${username}:${password}@${alternativeHost}:${port}/${database}?sslmode=${ssl ? 'require' : 'disable'}`;
           alternativeClientConfig = {
             connectionString: alternativeConnectionString,
             connectionTimeoutMillis: 10000,
           };
         }
         
         client = new Client(alternativeClientConfig);
        
        try {
           await client.connect();
         } catch (alternativeError) {
          
          // Provide specific error message for Supabase connections
          if (host.includes('supabase.co')) {
            const connectErrorMessage = connectError instanceof Error ? connectError.message : String(connectError);
            const alternativeErrorMessage = alternativeError instanceof Error ? alternativeError.message : String(alternativeError);
            
            const errorMessage = `Failed to connect to Supabase database. Both connection attempts failed:
1. ${host}: ${connectErrorMessage}
2. ${alternativeHost}: ${alternativeErrorMessage}

Please verify:
- Your Supabase project is active
- The connection string is correct
- Your IP is allowed in Supabase settings
- The database password is correct`;
            
            return new ChatSDKError(
              'bad_request:database',
              errorMessage,
            ).toResponse();
          }
          
          throw alternativeError;
        }
      } else {
        throw connectError;
      }
    }

    // Handle different actions
    switch (action) {
      case 'list_tables':
        return await handleListTables(client);
      
      case 'get_table_data':
        if (!tableName) {
          return new ChatSDKError(
            'bad_request:api',
            'Table name is required for get_table_data action.',
          ).toResponse();
        }
        return await handleGetTableData(client, tableName, page, pageSize, fetchAll);
      
      case 'get_foreign_key_data':
        if (!tableName) {
          return new ChatSDKError(
            'bad_request:api',
            'Table name is required for get_foreign_key_data action.',
          ).toResponse();
        }
        return await handleGetForeignKeyData(client, tableName);
      
      case 'execute_query':
      default:
        // Default behavior for backward compatibility
        if (!query) {
          return new ChatSDKError(
            'bad_request:api',
            'Query is required for execute_query action.',
          ).toResponse();
        }
        return await handleExecuteQuery(client, query);
    }
     } catch (error) {
    
    // Provide more specific error messages
    let errorMessage = 'Failed to execute operation';
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = `Table or view does not exist: ${error.message}`;
      } else if (error.message.includes('connection')) {
        errorMessage = `Connection failed: ${error.message}`;
      } else if (error.message.includes('authentication')) {
        errorMessage = `Authentication failed: ${error.message}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `Connection timeout: ${error.message}`;
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ENODATA')) {
        errorMessage = `DNS resolution failed: ${error.message}. Please check the hostname and network connectivity.`;
      } else if (error.message.includes('self-signed certificate') || error.message.includes('SELF_SIGNED_CERT')) {
        errorMessage = `SSL certificate issue: ${error.message}. This is common with Supabase connections and should be resolved with the updated SSL configuration.`;
      } else if (error.message.includes('column reference') && error.message.includes('is ambiguous')) {
        errorMessage = `SQL query error: ${error.message}. This is likely due to a column name conflict in the query.`;
      } else if (error.message.includes('syntax error')) {
        errorMessage = `SQL syntax error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new ChatSDKError(
      'bad_request:database',
      errorMessage,
    ).toResponse();
     } finally {
     // Always close the connection
     if (client) {
       try {
         await client.end();
       } catch (closeError) {
         // Silent fail on connection close
       }
     }
   }
}

async function handleListTables(client: Client) {
  // Query to get all tables in the current schema
  const tablesQuery = `
    SELECT 
      t.table_name,
      t.table_type,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public' 
      AND t.table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY t.table_name, c.ordinal_position
  `;

  const result = await client.query(tablesQuery);
  
  // Group columns by table
  const tablesMap = new Map();
  
  result.rows.forEach((row) => {
    const tableName = row.table_name;
    if (!tablesMap.has(tableName)) {
      tablesMap.set(tableName, {
        name: tableName,
        type: row.table_type,
        columns: []
      });
    }
    
    if (row.column_name) {
      tablesMap.get(tableName).columns.push({
        name: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        maxLength: row.character_maximum_length,
        numericPrecision: row.numeric_precision,
        numericScale: row.numeric_scale
      });
    }
  });

  const tables = Array.from(tablesMap.values());
  
  return NextResponse.json({
    tables,
    totalTables: tables.length
  });
}

async function handleGetTableData(client: Client, tableName: string, page: number, pageSize: number, fetchAll: boolean = false) {
  // Validate table name to prevent SQL injection
  const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) ? tableName : null;
  if (!validTableName) {
    return new ChatSDKError(
      'bad_request:api',
      'Invalid table name.',
    ).toResponse();
  }

  const offset = (page - 1) * pageSize;
  
  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`;
  const countResult = await client.query(countQuery);
  const totalRows = parseInt(countResult.rows[0].total);
  
  // Get table data - either with pagination or fetch all rows
  let dataQuery;
  if (fetchAll) {
    dataQuery = `SELECT * FROM "${tableName}"`;
  } else {
    dataQuery = `
      SELECT * FROM "${tableName}" 
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  }
  const dataResult = await client.query(dataQuery);
  
  // Get column metadata from information_schema with foreign key information
  const columnMetadataQuery = `
    SELECT 
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      CASE 
        WHEN fk.constraint_name IS NOT NULL THEN 
          fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE NULL 
      END as foreign_key_reference
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT DISTINCT
        kcu.column_name,
        kcu.constraint_name,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
    ) fk ON c.column_name = fk.column_name
    WHERE c.table_name = $1 
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position
  `;
  
  let columnMetadataResult;
  try {
    columnMetadataResult = await client.query(columnMetadataQuery, [tableName]);
  } catch (error) {
    // Fallback to simple column metadata query if foreign key query fails
    console.warn('Foreign key query failed, using fallback:', error);
    const fallbackQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    columnMetadataResult = await client.query(fallbackQuery, [tableName]);
  }
  
  // Create a map of column metadata
  const columnMetadataMap = new Map();
  columnMetadataResult.rows.forEach((row: any) => {
    columnMetadataMap.set(row.column_name.toLowerCase(), {
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      maxLength: row.character_maximum_length,
      numericPrecision: row.numeric_precision,
      numericScale: row.numeric_scale,
      foreignKeyReference: row.foreign_key_reference || null
    });
  });
  
  // Map the fields to include proper metadata
  const fields = dataResult.fields?.map((field: any) => {
    const metadata = columnMetadataMap.get(field.name.toLowerCase());
    return {
      name: field.name,
      dataType: metadata?.dataType || 'unknown',
      isNullable: metadata?.isNullable || false,
      defaultValue: metadata?.defaultValue || null,
      maxLength: metadata?.maxLength || null,
      numericPrecision: metadata?.numericPrecision || null,
      numericScale: metadata?.numericScale || null,
      foreignKeyReference: metadata?.foreignKeyReference || null,
      // Keep the original field properties for compatibility
      dataTypeID: field.dataTypeID,
      dataTypeSize: field.dataTypeSize,
      dataTypeModifier: field.dataTypeModifier,
      format: field.format,
    };
  }) || [];
  
  // Process rows to handle only actual NULL values, preserve legitimate "NOR" values
  const processedRows = (dataResult.rows || []).map((row: any) => {
    const processedRow: any = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      // Only convert actual NULL/undefined values to empty strings, preserve "NOR" as legitimate value
      if (value === null || value === undefined) {
        processedRow[key] = '';
      } else {
        processedRow[key] = value;
      }
    });
    return processedRow;
  });

  return NextResponse.json({
    rows: processedRows,
    fields: fields,
    rowCount: dataResult.rowCount || 0,
    totalRows,
    page,
    pageSize,
    totalPages: Math.ceil(totalRows / pageSize),
    isEmpty: totalRows === 0
  });
}

async function handleGetForeignKeyData(client: Client, tableName: string) {
  // Get foreign key relationships for the table
  const foreignKeyQuery = `
    SELECT 
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
  `;
  
  const foreignKeyResult = await client.query(foreignKeyQuery, [tableName]);
  
  return NextResponse.json({
    foreignKeys: foreignKeyResult.rows,
    totalForeignKeys: foreignKeyResult.rows.length
  });
}

async function handleExecuteQuery(client: Client, query: string) {
  // Validate that it's a SELECT query for security
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery.startsWith('select')) {
    return new ChatSDKError(
      'bad_request:api',
      'Only SELECT queries are allowed for security reasons.',
    ).toResponse();
  }

  // Execute the query
  const result = await client.query(query);
  
  return NextResponse.json({
    rows: result.rows,
    fields: result.fields?.map((field: any) => ({
      name: field.name,
      dataTypeID: field.dataTypeID,
      dataTypeSize: field.dataTypeSize,
      dataTypeModifier: field.dataTypeModifier,
      format: field.format,
    })) || [],
    rowCount: result.rowCount
  });
} 