import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: Date;
  status: 'Present' | 'Absent';
}

const attendanceSchema = new Schema<IAttendance>({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: [true, 'Status is required'],
  },
});

// one attendance entry per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);
