class EqualClause {
  constructor(protected field: string, protected value: string) {}

  toString(): string {
    return `${this.field} = ${this.value}`;
  }
}

class LikeClause {
  constructor(protected field: string, protected value: string) {}

  toString(): string {
    return `${this.field} ~ "${this.value}"`;
  }
}

class InClause {
  constructor(protected field: string, protected values: string[]) {}

  toString(): string {
    return `${this.field} IN (${this.values.map((v) => `"${v}"`)})`;
  }
}

type FilterClause = EqualClause | LikeClause | InClause;
type SortDirection = 'ASC' | 'DESC';

const present = (input: string | undefined): boolean =>
  !!input && !!input.length;

class OrderClause {
  constructor(
    protected field: string,
    protected direction: SortDirection = 'ASC'
  ) {}

  toString(): string {
    return `ORDER BY ${this.field} ${this.direction}`;
  }
}

class QueryBuilder {
  protected filterClauses: Array<FilterClause>;
  protected orderClause: OrderClause | undefined;

  constructor() {
    this.filterClauses = [];
    this.orderClause = undefined;
  }

  where(field: string, value: string): this {
    this.filterClauses.push(new EqualClause(field, value));
    return this;
  }

  in(field: string, values: string[]): this {
    this.filterClauses.push(new InClause(field, values));
    return this;
  }

  like(field: string, value: string): this {
    this.filterClauses.push(new LikeClause(field, value));
    return this;
  }

  order(field: string, direction: SortDirection = 'ASC'): this {
    this.orderClause = new OrderClause(field, direction);
    return this;
  }

  toString(): string {
    let query = this.filterClauses.map((c) => c.toString()).join(' AND ');

    if (this.orderClause) {
      query = [query, this.orderClause.toString()].filter(present).join(' ');
    }

    return query;
  }
}

export { QueryBuilder };
