# Jira Commandline Helper

This is just a little CLI tool to help manage my Jira workflow while avoiding
the UI as much as possible.

## Installation

```
git clone https://github.com/reagent/jira.git && \
  cd jira && \
  yarn && \
  yarn pack && \
  yarn global add `find ~+ -name '*.tgz' | sort -r | head -n1`
```

## Usage

Before you can interact with the API, you'll need to create an API token from
your [token management page][]. Once you have a token, you can initialize your
local configuration:

```
jira init \
  --email=user@host.example \
  --uri=https://example.atlassian.net
```

Enter your token at the prompt and your credentials will be written to the
global configuration file (`~/.config/jira/config.json`). You can now try out
some commands to test your credentials:

```
# See all tickets assigned to you
jira tickets --all

# See tickets that you're watching
jira tickets:watching
```

To see only active tickets, configure what you consider "active" statuses:

```
jira statuses:add "In Progress"
jira statuses:add "Accepted"
```

Now your list of tickets will be filtered on these active statuses by default:

```
jira tickets
```

For additional commands, see `jira --help`.

[token management page]: https://id.atlassian.com/manage-profile/security/api-tokens
