# SPFx (SharePoint) Personal Tab Online Meeting

This is an SPFx (SharePoint) Personal Tab Online Meeting app where you can create calendar-backed online meetings, delete them, join the meetings from the app, record them with transcriptions, and view them on the page via HTML5 video with enabled captions.

In this app, we assume that each recording must have a transcript associated with it because you may record a video without transcripts.

Apps need to set up Azure billing subscriptions to utilize the recordings and transcripts APIs. If an Azure billing subscription is not set up, an evaluation quota of 600 minutes/app/tenant/month is provided. To access transcription content and metadataContent, it costs $0.024 per minute. To access recording content, it costs $0.03 per minute.


To get started.
```
       Clone the repository

       git clone https://github.com/Ashot72/SPFx-Online-Meeting
       cd SPFx-Online-Meeting

       # Install dependencies
         npm install

       # Create a release package that should be deployed in the SharePoint app catalog
         npm run deploy
         
       # Approve permissions
         Make sure to approve the permissions from the API access page.
 
```

Go to [SPFx Personal Tab Online Meeting Video](https://youtu.be/I7jA3uH_h1w) page

Go to [SPFx Personal Tab Online Meeting Description](https://ashot72.github.io/SPFx-Online-Meeting/doc.html) page
