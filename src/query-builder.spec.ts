import { QueryBuilder } from './query-builder';

describe(QueryBuilder.name, () => {
  it('generates a query to match a field on a value', () => {
    const subject = new QueryBuilder().where('issuetype', 'Epic');
    expect(subject.toString()).toEqual('issuetype = Epic');
  });

  it('generates a query to match a field against multiple values', () => {
    const subject = new QueryBuilder().in('status', ['Accepted', 'Submitted']);

    expect(subject.toString()).toEqual('status IN ("Accepted","Submitted")');
  });

  it('generates a query to match a field on a partial value', () => {
    const subject = new QueryBuilder().like('summary', 'Tech Debt');
    expect(subject.toString()).toEqual('summary ~ "Tech Debt"');
  });

  it('generates an order clause', () => {
    const subject = new QueryBuilder().order('created_at', 'DESC');
    expect(subject.toString()).toEqual('ORDER BY created_at DESC');
  });

  it('can combine multiple query types', () => {
    const subject = new QueryBuilder()
      .where('issuetype', 'Epic')
      .in('status', ['Accepted', 'Submitted'])
      .where('team', '22')
      .like('summary', 'Tech Debt')
      .order('created_at');

    expect(subject.toString()).toEqual(
      'issuetype = Epic AND status IN ("Accepted","Submitted") AND team = 22 AND summary ~ "Tech Debt" ORDER BY created_at ASC'
    );
  });
});
