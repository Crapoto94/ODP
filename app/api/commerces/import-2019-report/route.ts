import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const reportPath = path.join(process.cwd(), 'scratch', 'match_report.json');
        if (!fs.existsSync(reportPath)) {
            return NextResponse.json({ error: "Report not found. Please run the matcher first." }, { status: 404 });
        }
        const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const reportPath = path.join(process.cwd(), 'scratch', 'match_report_approved.json');
        fs.writeFileSync(reportPath, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
