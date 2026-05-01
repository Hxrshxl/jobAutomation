import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppState extends Document {
  key: string;
  value: any;
  updatedAt: Date;
}

const AppStateSchema = new Schema<IAppState>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const AppState: Model<IAppState> =
  mongoose.models.AppState || mongoose.model<IAppState>('AppState', AppStateSchema);

export default AppState;
