# What is Bot Alias

AWS Lex provides a feature called "Alias" which is a reference to a version of your bot. You can create multiple aliases for different
purposes. For example, you may choose to have a "dev", "staging", "uat", and "prod" aliases. In addition, you can create aliases to
test new features that you want to implement for your bot.

By configuring react-lex-plus to use a specific alias, you can easily roll out new versions of the bot or roll back without having to
redeploy your website.

# Setting up Bot Alias

1. Log into your AWS account using [AWS Console](https://aws.amazon.com)
2. From AWS Console, navigate to "AWS Lex" service.
3. From the left menu, ensure "bots" is selected.
4. Under the Bots table, click on the name of your bot.
5. Click on the "settings" tab. This should be the tab next to "editor" tab.
6. Enter a new alias name in the textfield under "Aliases" section.
7. Select the appropriate bot version that the alias should be linked to.
8. Go back to editor screen by clicking the "editor" tab.
9. Scroll to the bottom of the page and hit "save intent".
10. Click "publish" on the top right corner.
11. In your react-lex-plus react component pass the "alias" props with the bot alias name set as the value.
