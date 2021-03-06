'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Emailer', function(searchService, INBOX_DEFAULT_AVATAR) {
    function Emailer(emailer) {
      var resolver;

      emailer.resolve = function() {
        if (!resolver) {
          resolver = searchService.searchByEmail(emailer.email).then(function(result) {
            emailer.name = result && result.displayName || emailer.name;
            emailer.avatarUrl = result && result.photo || INBOX_DEFAULT_AVATAR;
          });
        }

        return resolver;
      };

      return emailer;
    }

    return Emailer;
  })

  .factory('Email', function(mailboxesService, emailSendingService, Emailer, _) {

    function Email(email) {
      var isUnread = email.isUnread;

      Object.defineProperty(email, 'isUnread', {
        get: function() { return isUnread; },
        set: function(state) {
          if (isUnread !== state) {
            mailboxesService.flagIsUnreadChanged(email, state);
            isUnread = state;
          }
        }
      });

      email.hasReplyAll = emailSendingService.showReplyAllButton(email);
      email.from = email.from && Emailer(email.from);
      email.to = _.map(email.to, Emailer);
      email.cc = _.map(email.cc, Emailer);
      email.bcc = _.map(email.bcc, Emailer);

      return email;
    }

    return Email;
  })

  .factory('Thread', function(_) {

    function _defineFlagProperty(object, flag) {
      Object.defineProperty(object, flag, {
        get: function() {
          return _.any(this.emails, flag);
        },
        set: function(state) {
          this.emails.forEach(function(email) {
            email[flag] = state;
          });
        }
      });
    }

    function Thread(thread, emails) {
      thread.subject = emails && emails[0] ? emails[0].subject : '';
      thread.emails = emails || [];
      thread.lastEmail = _.last(thread.emails);
      thread.hasAttachment = !!(thread.lastEmail && thread.lastEmail.hasAttachment);

      _defineFlagProperty(thread, 'isUnread');
      _defineFlagProperty(thread, 'isFlagged');

      return thread;
    }

    return Thread;

  })

  .factory('Mailbox', function(inboxMailboxesCache, _) {
    function getMailboxDescendants(mailboxId) {
      var descendants = [];
      var toScanMailboxIds = [mailboxId];
      var scannedMailboxIds = [];

      function pushDescendant(mailbox) {
        descendants.push(mailbox);

        if (scannedMailboxIds.indexOf(mailbox.id) === -1) {
          toScanMailboxIds.push(mailbox.id);
        }
      }

      while (toScanMailboxIds.length) {
        var toScanMailboxId = toScanMailboxIds.shift();
        var mailboxChildren = _.filter(inboxMailboxesCache, { parentId: toScanMailboxId });

        scannedMailboxIds.push(toScanMailboxId);
        mailboxChildren.forEach(pushDescendant);
      }

      return _.uniq(descendants);
    }

    function Mailbox(mailbox) {
      var descendants;

      Object.defineProperty(mailbox, 'descendants', {
        configurable: true,
        get: function() {
          if (!descendants) {
            descendants = getMailboxDescendants(mailbox.id);
          }

          return descendants;
        }
      });

      return mailbox;
    }

    return Mailbox;
  });
