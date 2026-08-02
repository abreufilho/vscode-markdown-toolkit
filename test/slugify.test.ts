import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify, uniqueSlug } from '../src/lib/slugify';

test('lowercases, drops punctuation and joins words with hyphens', () => {
  assert.equal(slugify('Olá, Mundo!', 'github'), 'olá-mundo');
  assert.equal(slugify('  Spaced   Out  ', 'github'), 'spaced-out');
});

test('strips inline HTML from the heading', () => {
  assert.equal(slugify('<em>Title</em>', 'gitea'), 'title');
});

test('drops trailing hyphens only on gitlab', () => {
  assert.equal(slugify('Title -- ', 'gitlab'), 'title');
  assert.equal(slugify('Title -- ', 'github'), 'title---');
});

test('defaults to the github flavour', () => {
  assert.equal(slugify('Title -- '), 'title---');
});

test('numbers a repeated slug from its second occurrence', () => {
  const seen = new Map<string, number>();
  assert.equal(uniqueSlug('section', seen), 'section');
  assert.equal(uniqueSlug('section', seen), 'section-1');
  assert.equal(uniqueSlug('section', seen), 'section-2');
  assert.equal(uniqueSlug('other', seen), 'other');
});
