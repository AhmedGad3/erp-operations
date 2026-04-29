import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { Counter, CounterDocument } from "../../../DB/Models/Counter/counter.schema";

@Injectable()
export class CounterService {
    constructor(
        @InjectModel(Counter.name)
        private counterModel: Model<CounterDocument>,
    ) { }

   
    async getNext(name: string, session?: ClientSession): Promise<number> {
        const counter = await this.counterModel.findOneAndUpdate(
            { key: name },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, session },
        );

        return counter.seq;
    }
}
