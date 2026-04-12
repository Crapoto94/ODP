import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return NextResponse.json({ version: packageJson.version });
  } catch {
    return NextResponse.json({ version: '0.2.0' });
  }
}
