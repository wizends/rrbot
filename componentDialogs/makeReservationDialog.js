const { WaterfallDialog, ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
let endDialog = '';

class MakeReservationDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super('makeReservationDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.getName.bind(this),
            this.getNumberOfParticipants.bind(this),
            this.getDate.bind(this),
            this.getTime.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStep(step) {
        endDialog = false;
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to make a reservation', ['yes', 'no']);
    }

    async getName(step) {
        if (step.result === true) {
            return await step.prompt(TEXT_PROMPT, 'In what name reservation is to be made');
        }
    }

    async getNumberOfParticipants(step) {
        step.values.name = step.result;
        return await step.prompt(NUMBER_PROMPT, 'How many participants (0 - 150)?');
    }

    async getDate(step) {
        step.values.noOfParticipants = step.result;
        return await step.prompt(DATETIME_PROMPT, 'On which date you want to make the reservation?');
    }

    async getTime(step) {
        step.values.date = step.result;
        return await step.prompt(DATETIME_PROMPT, 'At what time?');
    }

    async confirmStep(step) {
        step.values.time = step.result;
        const msg = `
        You have entered following values: \n 
        Name: ${ step.value.name }\n 
        Participants: ${ step.values.noOfParticipants }\n
        Date: ${ step.values.date }\n
        Time: ${ step.values.time }`;
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to make a reservation?', ['yes', 'no']);
    }

    async summaryStep(step) {
        if (step.resulta === true) {
            await step.context.sendActivity('Reservation successfully made. Your reservation id is : 12345678');
            endDialog = true;
            return await step.endDialog();
        };
    }

    async noOfParticipantsValidator(promptContext) {
        return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
    }

    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.MakeReservationDialog = MakeReservationDialog;
