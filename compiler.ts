// Simple C Compiler - Compiles a subset of C to x86-64 GNU Assembly

// ============================================================================
// LEXER
// ============================================================================

type TokenType =
  | 'INT' | 'CHAR' | 'VOID' | 'CONST' | 'IF' | 'ELSE' | 'FOR' | 'WHILE' | 'RETURN'
  | 'IDENT' | 'NUMBER' | 'STRING'
  | 'LPAREN' | 'RPAREN' | 'LBRACE' | 'RBRACE' | 'LBRACKET' | 'RBRACKET'
  | 'SEMICOLON' | 'COMMA' | 'ASSIGN'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'LT' | 'GT' | 'LE' | 'GE' | 'EQ' | 'NE'
  | 'AND' | 'OR' | 'NOT'
  | 'AMPERSAND'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

class Lexer {
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private source: string;
  private keywords: Map<string, TokenType> = new Map([
    ['int', 'INT'],
    ['char', 'CHAR'],
    ['void', 'VOID'],
    ['const', 'CONST'],
    ['if', 'IF'],
    ['else', 'ELSE'],
    ['for', 'FOR'],
    ['while', 'WHILE'],
    ['return', 'RETURN'],
  ]);

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.source.length) {
      const token = this.nextToken();
      if (token) tokens.push(token);
    }
    tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col });
    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();
    if (this.pos >= this.source.length) return null;

    const startLine = this.line;
    const startCol = this.col;
    const ch = this.source[this.pos];

    // Single-line comment
    if (ch === '/' && this.source[this.pos + 1] === '/') {
      while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
        this.advance();
      }
      return null;
    }

    // Multi-line comment
    if (ch === '/' && this.source[this.pos + 1] === '*') {
      this.advance(); this.advance();
      while (this.pos < this.source.length - 1) {
        if (this.source[this.pos] === '*' && this.source[this.pos + 1] === '/') {
          this.advance(); this.advance();
          break;
        }
        this.advance();
      }
      return null;
    }

    // String literal
    if (ch === '"') {
      return this.readString(startLine, startCol);
    }

    // Character literal
    if (ch === "'") {
      return this.readChar(startLine, startCol);
    }

    // Number
    if (this.isDigit(ch)) {
      return this.readNumber(startLine, startCol);
    }

    // Identifier or keyword
    if (this.isAlpha(ch) || ch === '_') {
      return this.readIdent(startLine, startCol);
    }

    // Operators and punctuation
    return this.readOperator(startLine, startCol);
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else if (ch === '\n') {
        this.advance();
        this.line++;
        this.col = 1;
      } else {
        break;
      }
    }
  }

  private advance(): string {
    const ch = this.source[this.pos];
    this.pos++;
    this.col++;
    return ch;
  }

  private peek(offset: number = 0): string {
    return this.source[this.pos + offset] || '';
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  private isAlnum(ch: string): boolean {
    return this.isDigit(ch) || this.isAlpha(ch) || ch === '_';
  }

  private readString(line: number, col: number): Token {
    this.advance(); // skip opening "
    let value = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '0': value += '\0'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }
    this.advance(); // skip closing "
    return { type: 'STRING', value, line, col };
  }

  private readChar(line: number, col: number): Token {
    this.advance(); // skip opening '
    let value = '';
    if (this.source[this.pos] === '\\') {
      this.advance();
      const escaped = this.advance();
      switch (escaped) {
        case 'n': value = '\n'; break;
        case 't': value = '\t'; break;
        case 'r': value = '\r'; break;
        case '0': value = '\0'; break;
        case '\\': value = '\\'; break;
        case "'": value = "'"; break;
        default: value = escaped;
      }
    } else {
      value = this.advance();
    }
    this.advance(); // skip closing '
    return { type: 'NUMBER', value: String(value.charCodeAt(0)), line, col };
  }

  private readNumber(line: number, col: number): Token {
    let value = '';
    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      value += this.advance();
    }
    return { type: 'NUMBER', value, line, col };
  }

  private readIdent(line: number, col: number): Token {
    let value = '';
    while (this.pos < this.source.length && this.isAlnum(this.source[this.pos])) {
      value += this.advance();
    }
    const type = this.keywords.get(value) || 'IDENT';
    return { type, value, line, col };
  }

  private readOperator(line: number, col: number): Token {
    const ch = this.advance();
    const next = this.peek();

    switch (ch) {
      case '(': return { type: 'LPAREN', value: ch, line, col };
      case ')': return { type: 'RPAREN', value: ch, line, col };
      case '{': return { type: 'LBRACE', value: ch, line, col };
      case '}': return { type: 'RBRACE', value: ch, line, col };
      case '[': return { type: 'LBRACKET', value: ch, line, col };
      case ']': return { type: 'RBRACKET', value: ch, line, col };
      case ';': return { type: 'SEMICOLON', value: ch, line, col };
      case ',': return { type: 'COMMA', value: ch, line, col };
      case '+': return { type: 'PLUS', value: ch, line, col };
      case '-': return { type: 'MINUS', value: ch, line, col };
      case '*': return { type: 'STAR', value: ch, line, col };
      case '/': return { type: 'SLASH', value: ch, line, col };
      case '%': return { type: 'PERCENT', value: ch, line, col };
      case '&':
        if (next === '&') { this.advance(); return { type: 'AND', value: '&&', line, col }; }
        return { type: 'AMPERSAND', value: ch, line, col };
      case '|':
        if (next === '|') { this.advance(); return { type: 'OR', value: '||', line, col }; }
        throw new Error(`Unexpected character: ${ch}`);
      case '!':
        if (next === '=') { this.advance(); return { type: 'NE', value: '!=', line, col }; }
        return { type: 'NOT', value: ch, line, col };
      case '=':
        if (next === '=') { this.advance(); return { type: 'EQ', value: '==', line, col }; }
        return { type: 'ASSIGN', value: ch, line, col };
      case '<':
        if (next === '=') { this.advance(); return { type: 'LE', value: '<=', line, col }; }
        return { type: 'LT', value: ch, line, col };
      case '>':
        if (next === '=') { this.advance(); return { type: 'GE', value: '>=', line, col }; }
        return { type: 'GT', value: ch, line, col };
      default:
        throw new Error(`Unexpected character: ${ch} at line ${line}, col ${col}`);
    }
  }
}

// ============================================================================
// AST NODES
// ============================================================================

interface ASTNode {
  kind: string;
}

interface Program extends ASTNode {
  kind: 'Program';
  declarations: Declaration[];
}

type Declaration = FunctionDecl | FunctionProto | GlobalVarDecl;

interface FunctionProto extends ASTNode {
  kind: 'FunctionProto';
  returnType: TypeSpec;
  name: string;
  params: Parameter[];
}

interface FunctionDecl extends ASTNode {
  kind: 'FunctionDecl';
  returnType: TypeSpec;
  name: string;
  params: Parameter[];
  body: BlockStmt;
}

interface GlobalVarDecl extends ASTNode {
  kind: 'GlobalVarDecl';
  type: TypeSpec;
  name: string;
  arraySize?: number;
  initializer?: Expr;
}

interface Parameter extends ASTNode {
  kind: 'Parameter';
  type: TypeSpec;
  name: string;
}

interface TypeSpec {
  base: 'int' | 'char' | 'void';
  isPointer: boolean;
  isArray: boolean;
  isConst: boolean;
}

type Stmt = BlockStmt | ExprStmt | IfStmt | ForStmt | WhileStmt | ReturnStmt | VarDeclStmt;

interface BlockStmt extends ASTNode {
  kind: 'BlockStmt';
  statements: Stmt[];
}

interface ExprStmt extends ASTNode {
  kind: 'ExprStmt';
  expr: Expr | null;
}

interface IfStmt extends ASTNode {
  kind: 'IfStmt';
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
}

interface ForStmt extends ASTNode {
  kind: 'ForStmt';
  init: Expr | VarDeclStmt | null;
  condition: Expr | null;
  update: Expr | null;
  body: Stmt;
}

interface WhileStmt extends ASTNode {
  kind: 'WhileStmt';
  condition: Expr;
  body: Stmt;
}

interface ReturnStmt extends ASTNode {
  kind: 'ReturnStmt';
  value: Expr | null;
}

interface VarDeclStmt extends ASTNode {
  kind: 'VarDeclStmt';
  type: TypeSpec;
  name: string;
  arraySize?: number;
  initializer?: Expr;
}

type Expr = BinaryExpr | UnaryExpr | CallExpr | IndexExpr | AssignExpr | IdentExpr | NumberExpr | StringExpr | AddressOfExpr;

interface BinaryExpr extends ASTNode {
  kind: 'BinaryExpr';
  op: string;
  left: Expr;
  right: Expr;
}

interface UnaryExpr extends ASTNode {
  kind: 'UnaryExpr';
  op: string;
  operand: Expr;
}

interface CallExpr extends ASTNode {
  kind: 'CallExpr';
  callee: string;
  args: Expr[];
}

interface IndexExpr extends ASTNode {
  kind: 'IndexExpr';
  array: Expr;
  index: Expr;
}

interface AssignExpr extends ASTNode {
  kind: 'AssignExpr';
  target: Expr;
  value: Expr;
}

interface IdentExpr extends ASTNode {
  kind: 'IdentExpr';
  name: string;
}

interface NumberExpr extends ASTNode {
  kind: 'NumberExpr';
  value: number;
}

interface StringExpr extends ASTNode {
  kind: 'StringExpr';
  value: string;
}

interface AddressOfExpr extends ASTNode {
  kind: 'AddressOfExpr';
  operand: Expr;
}

// ============================================================================
// PARSER
// ============================================================================

class Parser {
  private pos: number = 0;
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const declarations: Declaration[] = [];
    while (!this.isAtEnd()) {
      declarations.push(this.parseDeclaration());
    }
    return { kind: 'Program', declarations };
  }

  private parseDeclaration(): Declaration {
    const type = this.parseTypeSpec();
    const name = this.expect('IDENT').value;

    if (this.check('LPAREN')) {
      return this.parseFunctionDeclOrProto(type, name);
    } else {
      return this.parseGlobalVarDecl(type, name);
    }
  }

  private parseFunctionDeclOrProto(returnType: TypeSpec, name: string): FunctionDecl | FunctionProto {
    this.expect('LPAREN');
    const params = this.parseParameters();
    this.expect('RPAREN');

    if (this.check('SEMICOLON')) {
      this.advance();
      return { kind: 'FunctionProto', returnType, name, params };
    }

    const body = this.parseBlockStmt();
    return { kind: 'FunctionDecl', returnType, name, params, body };
  }

  private parseParameters(): Parameter[] {
    const params: Parameter[] = [];
    if (!this.check('RPAREN')) {
      do {
        const type = this.parseTypeSpec();
        const name = this.check('IDENT') ? this.advance().value : '';
        // Handle array parameter syntax: int arr[]
        if (this.check('LBRACKET')) {
          this.advance();
          this.expect('RBRACKET');
          type.isPointer = true;
        }
        params.push({ kind: 'Parameter', type, name });
      } while (this.match('COMMA'));
    }
    return params;
  }

  private parseTypeSpec(): TypeSpec {
    let isConst = false;
    if (this.check('CONST')) {
      this.advance();
      isConst = true;
    }

    let base: 'int' | 'char' | 'void';
    if (this.check('INT')) {
      this.advance();
      base = 'int';
    } else if (this.check('CHAR')) {
      this.advance();
      base = 'char';
    } else if (this.check('VOID')) {
      this.advance();
      base = 'void';
    } else {
      throw this.error(`Expected type specifier, got ${this.peek().type}`);
    }

    let isPointer = false;
    while (this.check('STAR')) {
      this.advance();
      isPointer = true;
    }

    return { base, isPointer, isArray: false, isConst };
  }

  private parseGlobalVarDecl(type: TypeSpec, name: string): GlobalVarDecl {
    let arraySize: number | undefined;
    if (this.check('LBRACKET')) {
      this.advance();
      arraySize = parseInt(this.expect('NUMBER').value);
      this.expect('RBRACKET');
      type.isArray = true;
    }

    let initializer: Expr | undefined;
    if (this.check('ASSIGN')) {
      this.advance();
      initializer = this.parseExpr();
    }

    this.expect('SEMICOLON');
    return { kind: 'GlobalVarDecl', type, name, arraySize, initializer };
  }

  private parseBlockStmt(): BlockStmt {
    this.expect('LBRACE');
    const statements: Stmt[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      statements.push(this.parseStmt());
    }
    this.expect('RBRACE');
    return { kind: 'BlockStmt', statements };
  }

  private parseStmt(): Stmt {
    if (this.check('IF')) return this.parseIfStmt();
    if (this.check('FOR')) return this.parseForStmt();
    if (this.check('WHILE')) return this.parseWhileStmt();
    if (this.check('RETURN')) return this.parseReturnStmt();
    if (this.check('LBRACE')) return this.parseBlockStmt();
    if (this.checkType()) return this.parseVarDeclStmt();
    return this.parseExprStmt();
  }

  private checkType(): boolean {
    return this.check('INT') || this.check('CHAR') || this.check('VOID') || this.check('CONST');
  }

  private parseVarDeclStmt(): VarDeclStmt {
    const type = this.parseTypeSpec();
    const name = this.expect('IDENT').value;

    let arraySize: number | undefined;
    if (this.check('LBRACKET')) {
      this.advance();
      arraySize = parseInt(this.expect('NUMBER').value);
      this.expect('RBRACKET');
      type.isArray = true;
    }

    let initializer: Expr | undefined;
    if (this.check('ASSIGN')) {
      this.advance();
      initializer = this.parseExpr();
    }

    this.expect('SEMICOLON');
    return { kind: 'VarDeclStmt', type, name, arraySize, initializer };
  }

  private parseIfStmt(): IfStmt {
    this.expect('IF');
    this.expect('LPAREN');
    const condition = this.parseExpr();
    this.expect('RPAREN');
    const thenBranch = this.parseStmt();
    let elseBranch: Stmt | null = null;
    if (this.check('ELSE')) {
      this.advance();
      elseBranch = this.parseStmt();
    }
    return { kind: 'IfStmt', condition, thenBranch, elseBranch };
  }

  private parseForStmt(): ForStmt {
    this.expect('FOR');
    this.expect('LPAREN');

    let init: Expr | VarDeclStmt | null = null;
    if (!this.check('SEMICOLON')) {
      if (this.checkType()) {
        const type = this.parseTypeSpec();
        const name = this.expect('IDENT').value;
        let initializer: Expr | undefined;
        if (this.check('ASSIGN')) {
          this.advance();
          initializer = this.parseExpr();
        }
        init = { kind: 'VarDeclStmt', type, name, initializer };
      } else {
        init = this.parseExpr();
      }
    }
    this.expect('SEMICOLON');

    let condition: Expr | null = null;
    if (!this.check('SEMICOLON')) {
      condition = this.parseExpr();
    }
    this.expect('SEMICOLON');

    let update: Expr | null = null;
    if (!this.check('RPAREN')) {
      update = this.parseExpr();
    }
    this.expect('RPAREN');

    const body = this.parseStmt();
    return { kind: 'ForStmt', init, condition, update, body };
  }

  private parseWhileStmt(): WhileStmt {
    this.expect('WHILE');
    this.expect('LPAREN');
    const condition = this.parseExpr();
    this.expect('RPAREN');
    const body = this.parseStmt();
    return { kind: 'WhileStmt', condition, body };
  }

  private parseReturnStmt(): ReturnStmt {
    this.expect('RETURN');
    let value: Expr | null = null;
    if (!this.check('SEMICOLON')) {
      value = this.parseExpr();
    }
    this.expect('SEMICOLON');
    return { kind: 'ReturnStmt', value };
  }

  private parseExprStmt(): ExprStmt {
    if (this.check('SEMICOLON')) {
      this.advance();
      return { kind: 'ExprStmt', expr: null };
    }
    const expr = this.parseExpr();
    this.expect('SEMICOLON');
    return { kind: 'ExprStmt', expr };
  }

  private parseExpr(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const expr = this.parseOr();
    if (this.check('ASSIGN')) {
      this.advance();
      const value = this.parseAssignment();
      return { kind: 'AssignExpr', target: expr, value };
    }
    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.check('OR')) {
      const op = this.advance().value;
      const right = this.parseAnd();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();
    while (this.check('AND')) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseComparison();
    while (this.check('EQ') || this.check('NE')) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAdditive();
    while (this.check('LT') || this.check('GT') || this.check('LE') || this.check('GE')) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check('PLUS') || this.check('MINUS')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.check('STAR') || this.check('SLASH') || this.check('PERCENT')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check('MINUS') || this.check('NOT')) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', op, operand };
    }
    if (this.check('AMPERSAND')) {
      this.advance();
      const operand = this.parseUnary();
      return { kind: 'AddressOfExpr', operand };
    }
    if (this.check('STAR')) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', op, operand };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.check('LBRACKET')) {
        this.advance();
        const index = this.parseExpr();
        this.expect('RBRACKET');
        expr = { kind: 'IndexExpr', array: expr, index };
      } else if (this.check('LPAREN')) {
        this.advance();
        const args: Expr[] = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpr());
          } while (this.match('COMMA'));
        }
        this.expect('RPAREN');
        if (expr.kind === 'IdentExpr') {
          expr = { kind: 'CallExpr', callee: (expr as IdentExpr).name, args };
        } else {
          throw this.error('Expected function name');
        }
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    if (this.check('NUMBER')) {
      return { kind: 'NumberExpr', value: parseInt(this.advance().value) };
    }
    if (this.check('STRING')) {
      return { kind: 'StringExpr', value: this.advance().value };
    }
    if (this.check('IDENT')) {
      return { kind: 'IdentExpr', name: this.advance().value };
    }
    if (this.check('LPAREN')) {
      this.advance();
      const expr = this.parseExpr();
      this.expect('RPAREN');
      return expr;
    }
    throw this.error(`Unexpected token: ${this.peek().type}`);
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.tokens[this.pos - 1];
  }

  private expect(type: TokenType): Token {
    if (this.check(type)) return this.advance();
    throw this.error(`Expected ${type}, got ${this.peek().type}`);
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(`Parse error at line ${token.line}, col ${token.col}: ${message}`);
  }
}

// ============================================================================
// CODE GENERATOR (x86-64 GNU Assembly)
// ============================================================================

interface Variable {
  name: string;
  offset: number;  // Stack offset from rbp
  type: TypeSpec;
  arraySize?: number;
}

interface FunctionInfo {
  name: string;
  params: Parameter[];
  returnType: TypeSpec;
}

class CodeGenerator {
  private output: string[] = [];
  private labelCounter: number = 0;
  private stringLiterals: Map<string, string> = new Map();
  private currentFunction: string = '';
  private localVars: Map<string, Variable> = new Map();
  private stackOffset: number = 0;
  private functions: Map<string, FunctionInfo> = new Map();
  private globalVars: Set<string> = new Set();

  generate(program: Program): string {
    // First pass: collect function signatures
    for (const decl of program.declarations) {
      if (decl.kind === 'FunctionDecl' || decl.kind === 'FunctionProto') {
        this.functions.set(decl.name, {
          name: decl.name,
          params: decl.params,
          returnType: decl.returnType
        });
      } else if (decl.kind === 'GlobalVarDecl') {
        this.globalVars.add(decl.name);
      }
    }

    // Generate code
    this.emit('.section .note.GNU-stack,"",@progbits');
    this.emit('.section .text');
    this.emit('.globl main');

    for (const decl of program.declarations) {
      if (decl.kind === 'FunctionDecl') {
        this.generateFunction(decl);
      }
    }

    // Generate string literals
    if (this.stringLiterals.size > 0) {
      this.emit('');
      this.emit('.section .rodata');
      this.stringLiterals.forEach((value, label) => {
        this.emit(`${label}:`);
        const escaped = this.escapeString(value);
        this.emit(`    .string "${escaped}"`);
      });
    }

    // Generate global variables
    const globalDecls = program.declarations.filter(d => d.kind === 'GlobalVarDecl') as GlobalVarDecl[];
    if (globalDecls.length > 0) {
      this.emit('');
      this.emit('.section .bss');
      for (const decl of globalDecls) {
        const size = this.getTypeSize(decl.type) * (decl.arraySize || 1);
        this.emit(`    .comm ${decl.name}, ${size}, ${Math.min(size, 16)}`);
      }
    }

    return this.output.join('\n');
  }

  private escapeString(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
      .replace(/\0/g, '\\0');
  }

  private emit(line: string): void {
    this.output.push(line);
  }

  private newLabel(prefix: string = 'L'): string {
    return `.${prefix}${this.labelCounter++}`;
  }

  private getTypeSize(type: TypeSpec): number {
    if (type.isPointer || type.isArray) return 8;
    switch (type.base) {
      case 'char': return 1;
      case 'int': return 4;
      case 'void': return 0;
    }
  }

  private alignStack(size: number): number {
    return Math.ceil(size / 16) * 16;
  }

  private generateFunction(func: FunctionDecl): void {
    this.currentFunction = func.name;
    this.localVars.clear();
    this.stackOffset = 0;

    this.emit('');
    this.emit(`${func.name}:`);
    this.emit('    pushq %rbp');
    this.emit('    movq %rsp, %rbp');

    // Calculate stack space needed
    const stackSpace = this.calculateStackSpace(func);
    if (stackSpace > 0) {
      this.emit(`    subq $${this.alignStack(stackSpace)}, %rsp`);
    }

    // Store parameters
    const paramRegs = ['%rdi', '%rsi', '%rdx', '%rcx', '%r8', '%r9'];
    for (let i = 0; i < func.params.length && i < 6; i++) {
      const param = func.params[i];
      this.stackOffset += 8;
      const offset = -this.stackOffset;
      this.localVars.set(param.name, { name: param.name, offset, type: param.type });
      this.emit(`    movq ${paramRegs[i]}, ${offset}(%rbp)`);
    }

    // Generate body
    this.generateBlockStmt(func.body);

    // Epilogue (in case no return statement)
    this.emit(`    movl $0, %eax`);
    this.emit('    leave');
    this.emit('    ret');
  }

  private calculateStackSpace(func: FunctionDecl): number {
    let space = func.params.length * 8;
    const countVars = (stmts: Stmt[]): void => {
      for (const stmt of stmts) {
        if (stmt.kind === 'VarDeclStmt') {
          const varDecl = stmt as VarDeclStmt;
          if (varDecl.arraySize) {
            space += this.getTypeSize(varDecl.type) * varDecl.arraySize;
          } else {
            space += 8;
          }
        } else if (stmt.kind === 'BlockStmt') {
          countVars((stmt as BlockStmt).statements);
        } else if (stmt.kind === 'IfStmt') {
          const ifStmt = stmt as IfStmt;
          if (ifStmt.thenBranch.kind === 'BlockStmt') {
            countVars((ifStmt.thenBranch as BlockStmt).statements);
          }
          if (ifStmt.elseBranch?.kind === 'BlockStmt') {
            countVars((ifStmt.elseBranch as BlockStmt).statements);
          }
        } else if (stmt.kind === 'ForStmt') {
          const forStmt = stmt as ForStmt;
          if (forStmt.init?.kind === 'VarDeclStmt') {
            const varDecl = forStmt.init as VarDeclStmt;
            space += varDecl.arraySize ? this.getTypeSize(varDecl.type) * varDecl.arraySize : 8;
          }
          if (forStmt.body.kind === 'BlockStmt') {
            countVars((forStmt.body as BlockStmt).statements);
          }
        } else if (stmt.kind === 'WhileStmt') {
          const whileStmt = stmt as WhileStmt;
          if (whileStmt.body.kind === 'BlockStmt') {
            countVars((whileStmt.body as BlockStmt).statements);
          }
        }
      }
    };
    countVars(func.body.statements);
    return space;
  }

  private generateBlockStmt(block: BlockStmt): void {
    for (const stmt of block.statements) {
      this.generateStmt(stmt);
    }
  }

  private generateStmt(stmt: Stmt): void {
    switch (stmt.kind) {
      case 'BlockStmt':
        this.generateBlockStmt(stmt as BlockStmt);
        break;
      case 'ExprStmt':
        if ((stmt as ExprStmt).expr) {
          this.generateExpr((stmt as ExprStmt).expr!);
        }
        break;
      case 'IfStmt':
        this.generateIfStmt(stmt as IfStmt);
        break;
      case 'ForStmt':
        this.generateForStmt(stmt as ForStmt);
        break;
      case 'WhileStmt':
        this.generateWhileStmt(stmt as WhileStmt);
        break;
      case 'ReturnStmt':
        this.generateReturnStmt(stmt as ReturnStmt);
        break;
      case 'VarDeclStmt':
        this.generateVarDeclStmt(stmt as VarDeclStmt);
        break;
    }
  }

  private generateVarDeclStmt(stmt: VarDeclStmt): void {
    if (stmt.arraySize) {
      const elemSize = stmt.type.base === 'char' ? 1 : 4;
      const totalSize = this.alignStack(elemSize * stmt.arraySize);
      this.stackOffset += totalSize;
      const offset = -this.stackOffset;
      this.localVars.set(stmt.name, {
        name: stmt.name,
        offset,
        type: { ...stmt.type, isArray: true },
        arraySize: stmt.arraySize
      });
    } else {
      this.stackOffset += 8;
      const offset = -this.stackOffset;
      this.localVars.set(stmt.name, { name: stmt.name, offset, type: stmt.type });

      if (stmt.initializer) {
        this.generateExpr(stmt.initializer);
        if (stmt.type.base === 'char' && !stmt.type.isPointer) {
          this.emit(`    movb %al, ${offset}(%rbp)`);
        } else if (stmt.type.base === 'int' && !stmt.type.isPointer) {
          this.emit(`    movl %eax, ${offset}(%rbp)`);
        } else {
          this.emit(`    movq %rax, ${offset}(%rbp)`);
        }
      }
    }
  }

  private generateIfStmt(stmt: IfStmt): void {
    const elseLabel = this.newLabel('else');
    const endLabel = this.newLabel('endif');

    this.generateExpr(stmt.condition);
    this.emit('    cmpl $0, %eax');
    this.emit(`    je ${stmt.elseBranch ? elseLabel : endLabel}`);

    this.generateStmt(stmt.thenBranch);

    if (stmt.elseBranch) {
      this.emit(`    jmp ${endLabel}`);
      this.emit(`${elseLabel}:`);
      this.generateStmt(stmt.elseBranch);
    }

    this.emit(`${endLabel}:`);
  }

  private generateForStmt(stmt: ForStmt): void {
    const condLabel = this.newLabel('for_cond');
    const endLabel = this.newLabel('for_end');

    if (stmt.init) {
      if (stmt.init.kind === 'VarDeclStmt') {
        this.generateVarDeclStmt(stmt.init as VarDeclStmt);
      } else {
        this.generateExpr(stmt.init as Expr);
      }
    }

    this.emit(`${condLabel}:`);

    if (stmt.condition) {
      this.generateExpr(stmt.condition);
      this.emit('    cmpl $0, %eax');
      this.emit(`    je ${endLabel}`);
    }

    this.generateStmt(stmt.body);

    if (stmt.update) {
      this.generateExpr(stmt.update);
    }

    this.emit(`    jmp ${condLabel}`);
    this.emit(`${endLabel}:`);
  }

  private generateWhileStmt(stmt: WhileStmt): void {
    const condLabel = this.newLabel('while_cond');
    const endLabel = this.newLabel('while_end');

    this.emit(`${condLabel}:`);
    this.generateExpr(stmt.condition);
    this.emit('    cmpl $0, %eax');
    this.emit(`    je ${endLabel}`);

    this.generateStmt(stmt.body);

    this.emit(`    jmp ${condLabel}`);
    this.emit(`${endLabel}:`);
  }

  private generateReturnStmt(stmt: ReturnStmt): void {
    if (stmt.value) {
      this.generateExpr(stmt.value);
    } else {
      this.emit('    movl $0, %eax');
    }
    this.emit('    leave');
    this.emit('    ret');
  }

  private generateExpr(expr: Expr): void {
    switch (expr.kind) {
      case 'NumberExpr':
        this.emit(`    movl $${(expr as NumberExpr).value}, %eax`);
        break;
      case 'StringExpr':
        const label = this.newLabel('str');
        this.stringLiterals.set(label, (expr as StringExpr).value);
        this.emit(`    leaq ${label}(%rip), %rax`);
        break;
      case 'IdentExpr':
        this.generateIdentExpr(expr as IdentExpr);
        break;
      case 'BinaryExpr':
        this.generateBinaryExpr(expr as BinaryExpr);
        break;
      case 'UnaryExpr':
        this.generateUnaryExpr(expr as UnaryExpr);
        break;
      case 'CallExpr':
        this.generateCallExpr(expr as CallExpr);
        break;
      case 'IndexExpr':
        this.generateIndexExpr(expr as IndexExpr, false);
        break;
      case 'AssignExpr':
        this.generateAssignExpr(expr as AssignExpr);
        break;
      case 'AddressOfExpr':
        this.generateAddressOfExpr(expr as AddressOfExpr);
        break;
    }
  }

  private generateIdentExpr(expr: IdentExpr): void {
    const localVar = this.localVars.get(expr.name);
    if (localVar) {
      if (localVar.type.isArray) {
        // For arrays, load address
        this.emit(`    leaq ${localVar.offset}(%rbp), %rax`);
      } else if (localVar.type.base === 'char' && !localVar.type.isPointer) {
        this.emit(`    movsbl ${localVar.offset}(%rbp), %eax`);
      } else if (localVar.type.base === 'int' && !localVar.type.isPointer) {
        this.emit(`    movl ${localVar.offset}(%rbp), %eax`);
      } else {
        this.emit(`    movq ${localVar.offset}(%rbp), %rax`);
      }
    } else if (this.globalVars.has(expr.name)) {
      this.emit(`    movl ${expr.name}(%rip), %eax`);
    } else {
      throw new Error(`Undefined variable: ${expr.name}`);
    }
  }

  private generateBinaryExpr(expr: BinaryExpr): void {
    // Handle short-circuit evaluation for && and ||
    if (expr.op === '&&') {
      const falseLabel = this.newLabel('and_false');
      const endLabel = this.newLabel('and_end');
      this.generateExpr(expr.left);
      this.emit('    cmpl $0, %eax');
      this.emit(`    je ${falseLabel}`);
      this.generateExpr(expr.right);
      this.emit('    cmpl $0, %eax');
      this.emit(`    je ${falseLabel}`);
      this.emit('    movl $1, %eax');
      this.emit(`    jmp ${endLabel}`);
      this.emit(`${falseLabel}:`);
      this.emit('    movl $0, %eax');
      this.emit(`${endLabel}:`);
      return;
    }

    if (expr.op === '||') {
      const trueLabel = this.newLabel('or_true');
      const endLabel = this.newLabel('or_end');
      this.generateExpr(expr.left);
      this.emit('    cmpl $0, %eax');
      this.emit(`    jne ${trueLabel}`);
      this.generateExpr(expr.right);
      this.emit('    cmpl $0, %eax');
      this.emit(`    jne ${trueLabel}`);
      this.emit('    movl $0, %eax');
      this.emit(`    jmp ${endLabel}`);
      this.emit(`${trueLabel}:`);
      this.emit('    movl $1, %eax');
      this.emit(`${endLabel}:`);
      return;
    }

    this.generateExpr(expr.right);
    this.emit('    pushq %rax');
    this.generateExpr(expr.left);
    this.emit('    popq %rcx');

    switch (expr.op) {
      case '+':
        this.emit('    addl %ecx, %eax');
        break;
      case '-':
        this.emit('    subl %ecx, %eax');
        break;
      case '*':
        this.emit('    imull %ecx, %eax');
        break;
      case '/':
        this.emit('    cltd');
        this.emit('    idivl %ecx');
        break;
      case '%':
        this.emit('    cltd');
        this.emit('    idivl %ecx');
        this.emit('    movl %edx, %eax');
        break;
      case '<':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    setl %al');
        this.emit('    movzbl %al, %eax');
        break;
      case '>':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    setg %al');
        this.emit('    movzbl %al, %eax');
        break;
      case '<=':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    setle %al');
        this.emit('    movzbl %al, %eax');
        break;
      case '>=':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    setge %al');
        this.emit('    movzbl %al, %eax');
        break;
      case '==':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    sete %al');
        this.emit('    movzbl %al, %eax');
        break;
      case '!=':
        this.emit('    cmpl %ecx, %eax');
        this.emit('    setne %al');
        this.emit('    movzbl %al, %eax');
        break;
    }
  }

  private generateUnaryExpr(expr: UnaryExpr): void {
    if (expr.op === '*') {
      // Dereference
      this.generateExpr(expr.operand);
      this.emit('    movl (%rax), %eax');
    } else {
      this.generateExpr(expr.operand);
      switch (expr.op) {
        case '-':
          this.emit('    negl %eax');
          break;
        case '!':
          this.emit('    cmpl $0, %eax');
          this.emit('    sete %al');
          this.emit('    movzbl %al, %eax');
          break;
      }
    }
  }

  private generateCallExpr(expr: CallExpr): void {
    // Save caller-saved registers if needed
    const paramRegs = ['%rdi', '%rsi', '%rdx', '%rcx', '%r8', '%r9'];

    // Generate arguments in reverse order
    for (let i = expr.args.length - 1; i >= 0; i--) {
      this.generateExpr(expr.args[i]);
      if (i < 6) {
        this.emit(`    pushq %rax`);
      }
    }

    // Pop arguments into registers
    for (let i = 0; i < Math.min(expr.args.length, 6); i++) {
      this.emit(`    popq ${paramRegs[i]}`);
    }

    // Align stack to 16 bytes before call
    this.emit(`    movl $0, %eax`);  // Clear %al for varargs
    this.emit(`    call ${expr.callee}`);
  }

  private generateIndexExpr(expr: IndexExpr, forAddress: boolean = false): void {
    // Get array base address
    if (expr.array.kind === 'IdentExpr') {
      const name = (expr.array as IdentExpr).name;
      const localVar = this.localVars.get(name);
      if (localVar) {
        if (localVar.type.isArray) {
          this.emit(`    leaq ${localVar.offset}(%rbp), %rax`);
        } else {
          // It's a pointer, load its value
          this.emit(`    movq ${localVar.offset}(%rbp), %rax`);
        }
      } else if (this.globalVars.has(name)) {
        this.emit(`    leaq ${name}(%rip), %rax`);
      }
    } else {
      this.generateExpr(expr.array);
    }
    this.emit('    pushq %rax');

    // Generate index
    this.generateExpr(expr.index);
    this.emit('    movslq %eax, %rax');  // Sign extend to 64-bit
    
    // Determine element size
    let elemSize = 4; // default to int
    if (expr.array.kind === 'IdentExpr') {
      const name = (expr.array as IdentExpr).name;
      const localVar = this.localVars.get(name);
      if (localVar && localVar.type.base === 'char') {
        elemSize = 1;
      }
    }
    
    if (elemSize === 4) {
      this.emit('    shlq $2, %rax');  // Multiply by 4 for int
    }

    this.emit('    popq %rcx');
    this.emit('    addq %rcx, %rax');

    if (!forAddress) {
      if (elemSize === 1) {
        this.emit('    movsbl (%rax), %eax');
      } else {
        this.emit('    movl (%rax), %eax');
      }
    }
  }

  private generateAssignExpr(expr: AssignExpr): void {
    if (expr.target.kind === 'IdentExpr') {
      const name = (expr.target as IdentExpr).name;
      this.generateExpr(expr.value);
      const localVar = this.localVars.get(name);
      if (localVar) {
        if (localVar.type.base === 'char' && !localVar.type.isPointer && !localVar.type.isArray) {
          this.emit(`    movb %al, ${localVar.offset}(%rbp)`);
        } else if (localVar.type.base === 'int' && !localVar.type.isPointer && !localVar.type.isArray) {
          this.emit(`    movl %eax, ${localVar.offset}(%rbp)`);
        } else {
          this.emit(`    movq %rax, ${localVar.offset}(%rbp)`);
        }
      } else if (this.globalVars.has(name)) {
        this.emit(`    movl %eax, ${name}(%rip)`);
      }
    } else if (expr.target.kind === 'IndexExpr') {
      const indexExpr = expr.target as IndexExpr;
      
      // Generate value first
      this.generateExpr(expr.value);
      this.emit('    pushq %rax');
      
      // Generate address
      this.generateIndexExpr(indexExpr, true);
      this.emit('    movq %rax, %rcx');  // Address in %rcx
      
      this.emit('    popq %rax');
      
      // Determine element size
      let elemSize = 4;
      if (indexExpr.array.kind === 'IdentExpr') {
        const name = (indexExpr.array as IdentExpr).name;
        const localVar = this.localVars.get(name);
        if (localVar && localVar.type.base === 'char') {
          elemSize = 1;
        }
      }
      
      if (elemSize === 1) {
        this.emit('    movb %al, (%rcx)');
      } else {
        this.emit('    movl %eax, (%rcx)');
      }
    } else if (expr.target.kind === 'UnaryExpr' && (expr.target as UnaryExpr).op === '*') {
      // Dereference assignment
      const unary = expr.target as UnaryExpr;
      this.generateExpr(expr.value);
      this.emit('    pushq %rax');
      this.generateExpr(unary.operand);
      this.emit('    movq %rax, %rcx');
      this.emit('    popq %rax');
      this.emit('    movl %eax, (%rcx)');
    }
  }

  private generateAddressOfExpr(expr: AddressOfExpr): void {
    if (expr.operand.kind === 'IdentExpr') {
      const name = (expr.operand as IdentExpr).name;
      const localVar = this.localVars.get(name);
      if (localVar) {
        this.emit(`    leaq ${localVar.offset}(%rbp), %rax`);
      } else if (this.globalVars.has(name)) {
        this.emit(`    leaq ${name}(%rip), %rax`);
      }
    } else if (expr.operand.kind === 'IndexExpr') {
      this.generateIndexExpr(expr.operand as IndexExpr, true);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

function compile(source: string): string {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  const generator = new CodeGenerator();
  return generator.generate(ast);
}

// Read from command line argument or stdin
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore
const fs = require('fs');

// @ts-ignore
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: npx ts-node compiler.ts <input.c>');
  // @ts-ignore
  process.exit(1);
}

const source = fs.readFileSync(inputFile, 'utf-8');
const assembly = compile(source);
console.log(assembly);
