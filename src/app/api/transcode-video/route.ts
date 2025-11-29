import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import { getServiceRoleClient, getPhotoPublicUrl } from '@/lib/supabase';

type Payload = {
  sourceUrl: string;
  eventId?: string;
  formats?: string[]; // e.g. ['mp4','webm']
};

async function downloadToFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download source: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.promises.writeFile(dest, Buffer.from(arrayBuffer));
}

function runFfmpeg(args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, args, { stdio: 'inherit', cwd });
    proc.on('error', (err) => reject(err));
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

function ffmpegAvailable(): boolean {
  try {
    const result = spawn(ffmpegPath as string, ['-version'], { stdio: 'ignore' });
    return result.exitCode === 0 || result.pid !== undefined;
  } catch (e) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Payload;
    const { sourceUrl, eventId = 'transcoded', formats = ['mp4', 'webm'] } = payload;

    if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 });

    // Only allow Supabase storage / custom domain for security in this POC
    const allowedHost = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const customDomain = 'https://sharedfrom.snapworxx.com';
    if (!(sourceUrl.startsWith(allowedHost) || sourceUrl.startsWith(customDomain))) {
      return NextResponse.json({ error: 'sourceUrl must be from configured Supabase storage' }, { status: 400 });
    }

    if (!ffmpegAvailable()) {
      return NextResponse.json({ error: 'ffmpeg-unavailable' }, { status: 503 });
    }

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'transcode-'));
    const inputExt = path.extname(new URL(sourceUrl).pathname) || '.in';
    const inputPath = path.join(tmpDir, `input${inputExt}`);

    await downloadToFile(sourceUrl, inputPath);

    const results: Record<string, string> = {};
    const supabase = getServiceRoleClient();

    for (const fmt of formats) {
      const outName = `${uuidv4()}.${fmt}`;
      const outPath = path.join(tmpDir, outName);

      if (fmt === 'mp4') {
        // H.264 + AAC
        const args = ['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', outPath];
        await runFfmpeg(args);
      } else if (fmt === 'webm') {
        // VP9 + Opus
        const args = ['-y', '-i', inputPath, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', outPath];
        await runFfmpeg(args);
      } else {
        // Try a generic copy (container change) as fallback
        const args = ['-y', '-i', inputPath, '-c', 'copy', outPath];
        await runFfmpeg(args);
      }

      // Upload to Supabase storage
      const destPath = `${eventId}/${Date.now()}-${outName}`;
      const stream = fs.createReadStream(outPath);
      const contentType = fmt === 'webm' ? 'video/webm' : 'video/mp4';

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(destPath, stream, { contentType, upsert: false });

      if (error) {
        throw error;
      }

      results[fmt] = getPhotoPublicUrl(destPath);
    }

    // Cleanup tmp
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('Transcode error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET(req?: Request) {
  const available = ffmpegAvailable();
  return NextResponse.json({ available });
}

export const runtime = 'nodejs';
