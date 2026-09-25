# Lockin — Code Signing Policy

This document describes how Lockin binaries are code-signed. It is published
as part of the project's transparency requirements for free open-source code
signing via the SignPath Foundation.

## 1. Project identity

- **Project:** Lockin — a tiny, premium always-on-top floating countdown timer
  for Windows and macOS.
- **Source repository:** https://github.com/AvinashT1625/lockin-github-repo
- **License:** MIT (OSI-approved). Every component of this project is
  open source; there are no proprietary components other than standard
  system libraries and the Electron runtime.
- **Maintainer:** Avinash T (sole maintainer).

## 2. What gets signed

- Only the **Windows NSIS installer** (`Lockin-*.exe`) produced from this
  repository is submitted for signing.
- Binaries are built by the project's GitHub Actions workflow
  (`.github/workflows/build.yml`) running on `windows-latest`, directly from
  a tagged release commit in this repository. No locally built binaries are
  ever submitted.
- Third-party binaries are never submitted for signing as Lockin binaries.

## 3. Who can request signatures

- Only the maintainer (Avinash T) can trigger the release workflow and
  approve signing requests. There is no public signing service and no
  third party may request signatures for this project.

## 4. Key custody

- Signing is performed by the SignPath Foundation using a certificate held
  in their hardware security module (HSM). The maintainer never handles the
  private key.
- Signed binaries are published on this repository's
  [Releases](https://github.com/AvinashT1625/lockin-github-repo/releases)
  page. The publisher name on signed Windows binaries reads
  "SignPath Foundation".

## 5. Verification

- Anyone can verify that a released installer corresponds to public source:
  check out the release tag, follow "Building from source" in the README,
  and compare the resulting unsigned binary's contents with the released one
  (only the Authenticode signature differs).

## 6. Abuse contact

- If you believe a Lockin binary has been tampered with or mis-signed,
  open an issue at
  https://github.com/AvinashT1625/lockin-github-repo/issues.

*Attribution: Windows code signing provided free of charge by the
[SignPath Foundation](https://signpath.org).*
