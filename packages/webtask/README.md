## Install dependencies
```bash
cd exec
yarn
```

## Set up the credentials
Run the config crendentials command to create a local profile. You will be asked for a phone number or email. You'll immediately receive a verification code. Enter the verification code and your profile will be entirely setup and ready to use.

```bash
serverless config credentials --provider webtasks
```

## Deploy
```
serverless deploy
```
