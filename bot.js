// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeReservationDialog } = require('./componentDialogs/makeReservationDialog');

class RrBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty('dialogState');
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);
        this.previousIntent = this.conversationState.createProperty('previousIntent');
        this.conversationData = this.conversationState.createProperty('conversationData');
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await this.dispatchToIntentAsync(context);
            await next();
        });

        this.onDialog(async (context, next) => {
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `
                Welcome to Restaurant Reservation Bot ${ activity.membersAdded[idx].name }.
                `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        const reply = MessageFactory.suggestedActions(['Make Reservation', 'Cancel Reservation', 'Restaurant Address'], 'What would you like to do today?');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context) {
        let currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});

        if (previousIntent.intentName && conversationData.endDialog === false) {
            currentIntent = previousIntent.intentName;
        } else if (previousIntent.intentName && conversationData.endDialog === true) {
            currentIntent = context.activity.text;
        } else {
            currentIntent = context.text;
            await this.previousIntent.set(context, { intentName: context.activity.text });
        }
        switch (currentIntent) {
        case 'Make Reservation':
            console.log('Inside Make Reservation Case');
            await this.conversationData.set(context, { endDialog: false });
            await this.makeReservationDialog.run(context, this.dialogState);
            conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
            break;
        default:
            console.log('Did not match Make Reservation case');
            break;
        }
    }
}

module.exports.RrBot = RrBot;
