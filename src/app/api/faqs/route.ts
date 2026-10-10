import { NextResponse } from 'next/server';
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET() {
  try {
    const faqs = getAllFaqs();
    return NextResponse.json({ success: true, faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    if (!body.question || !body.answer) {
      return NextResponse.json({ success: false, error: 'Question and answer are required' }, { status: 400 });
    }

    const faq = createFaq({
      question: body.question.trim(),
      answer: body.answer.trim(),
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updated = updateFaq(body.id, {
      question: body.question?.trim(),
      answer: body.answer?.trim(),
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const ok = deleteFaq(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
