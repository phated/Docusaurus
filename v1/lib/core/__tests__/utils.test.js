/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const utils = require('../utils');

const blogPostWithTruncateContents = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'blog-post-with-truncate.md'),
  'utf8',
);

const blogPostWithoutTruncateContents = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'blog-post-without-truncate.md'),
  'utf8',
);

describe('utils', () => {
  test('blogPostHasTruncateMarker', () => {
    expect(utils.blogPostHasTruncateMarker(blogPostWithTruncateContents)).toBe(
      true,
    );
    expect(
      utils.blogPostHasTruncateMarker(blogPostWithoutTruncateContents),
    ).toBe(false);
  });

  test('extractBlogPostBeforeTruncate', () => {
    expect(
      utils.extractBlogPostBeforeTruncate(blogPostWithTruncateContents),
    ).toMatchSnapshot();
    expect(
      utils.extractBlogPostBeforeTruncate(blogPostWithoutTruncateContents),
    ).toMatchSnapshot();
  });

  test('getPath', () => {
    // does not change/transform path
    expect(utils.getPath('/en/users.html', false)).toBe('/en/users.html');
    expect(utils.getPath('/en/versioning.html', false)).toBe(
      '/en/versioning.html',
    );
    expect(utils.getPath(undefined, false)).toBeUndefined();
    expect(utils.getPath(null, false)).toBeNull();

    // transform to pretty/clean path
    const cleanPath = pathStr => utils.getPath(pathStr, true);
    expect(cleanPath('/en/users')).toBe('/en/users');
    expect(cleanPath('/versioning.html')).toBe('/versioning');
    expect(cleanPath('/en/users.html')).toBe('/en/users');
    expect(cleanPath('/en/asd/index.html')).toBe('/en/asd/');
    expect(cleanPath('/en/help/index.html')).toBe('/en/help/');
    expect(cleanPath('/index.html')).toBe('/');
    expect(cleanPath('/react/index.html')).toBe('/react/');
    expect(cleanPath('/en/help.a.b.c.d.e.html')).toBe('/en/help.a.b.c.d.e');
    expect(cleanPath('/en/help.js')).toBe('/en/help.js');
    expect(cleanPath('/test.md')).toBe('/test.md');
    expect(cleanPath('/blog/7.0.0')).toBe('/blog/7.0.0');
    expect(cleanPath('/test/5.html.2')).toBe('/test/5.html.2');
    expect(cleanPath('/en/5.2')).toBe('/en/5.2');
  });

  test('removeExtension', () => {
    expect(utils.removeExtension('/endiliey.html')).toBe('/endiliey');
    expect(utils.removeExtension('/a.b/')).toBe('/a.b/');
    expect(utils.removeExtension('/a.b/c.png')).toBe('/a.b/c');
    expect(utils.removeExtension('/a.b/c.d.e')).toBe('/a.b/c.d');
    expect(utils.removeExtension('/test')).toBe('/test');
    expect(utils.removeExtension('pages.js')).toBe('pages');
  });

  test('getGitLastUpdated', () => {
    // existing test file in repository with git timestamp
    const existingFilePath = path.join(__dirname, '__fixtures__', 'test.md');
    const gitLastUpdated = utils.getGitLastUpdated(existingFilePath);
    expect(typeof gitLastUpdated).toBe('string');
    expect(Date.parse(gitLastUpdated)).not.toBeNaN();
    expect(gitLastUpdated).not.toBeNull();

    // non existing file
    const nonExistingFilePath = path.join(
      __dirname,
      '__fixtures__',
      '.nonExisting',
    );
    expect(utils.getGitLastUpdated(null)).toBeNull();
    expect(utils.getGitLastUpdated(undefined)).toBeNull();
    expect(utils.getGitLastUpdated(nonExistingFilePath)).toBeNull();

    // temporary created file that has no git timestamp
    const tempFilePath = path.join(__dirname, '__fixtures__', '.temp');
    fs.writeFileSync(tempFilePath, 'Lorem ipsum :)');
    expect(utils.getGitLastUpdated(tempFilePath)).toBeNull();
    fs.unlinkSync(tempFilePath);

    // test renaming and moving file

    const tempFilePath2 = path.join(__dirname, '__fixtures__', '.temp2');
    const tempFilePath3 = path.join(
      __dirname,
      '__fixtures__',
      'test',
      '.temp3',
    );

    // create new file
    shell.exec = jest.fn(() => ({
      stdout:
        '1539502055\n' +
        '\n' +
        ' create mode 100644 v1/lib/core/__tests__/__fixtures__/.temp2\n',
    }));
    const createTime = utils.getGitLastUpdated(tempFilePath2);
    expect(typeof createTime).toBe('string');

    // rename / move the file
    shell.exec = jest.fn(() => ({
      stdout:
        '1539502056\n' +
        '\n' +
        ' rename v1/lib/core/__tests__/__fixtures__/{.temp2 => test/.temp3} (100%)\n' +
        '1539502055\n' +
        '\n' +
        ' create mode 100644 v1/lib/core/__tests__/__fixtures__/.temp2\n',
    }));
    const lastUpdateTime = utils.getGitLastUpdated(tempFilePath3);
    // should only consider file content change
    expect(lastUpdateTime).toEqual(createTime);
  });

  test('idx', () => {
    const a = {};
    const b = {hello: 'world'};
    const env = {
      translation: {
        enabled: true,
        enabledLanguages: [
          {
            enabled: true,
            name: 'English',
            tag: 'en',
          },
          {
            enabled: true,
            name: '日本語',
            tag: 'ja',
          },
        ],
      },
      versioning: {
        enabled: false,
        versions: [],
      },
    };
    const variable = 'enabledLanguages';
    expect(utils.idx(a, [('b', 'c')])).toBeUndefined();
    expect(utils.idx(b, ['hello'])).toEqual('world');
    expect(utils.idx(b, 'hello')).toEqual('world');
    expect(utils.idx(env, 'typo')).toBeUndefined();
    expect(utils.idx(env, 'versioning')).toEqual({
      enabled: false,
      versions: [],
    });
    expect(utils.idx(env, ['translation', 'enabled'])).toEqual(true);
    expect(
      utils.idx(env, ['translation', variable]).map(lang => lang.tag),
    ).toEqual(['en', 'ja']);
    expect(utils.idx(undefined)).toBeUndefined();
    expect(utils.idx(null)).toBeNull();
  });
});
